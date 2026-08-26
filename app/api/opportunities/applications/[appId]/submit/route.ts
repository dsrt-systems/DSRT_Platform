import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackOpportunityEvent } from '@/lib/events/opportunity-events'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // 1. Fetch Application + Opportunity + Questions
    const { data: app } = await supabase
      .from('opportunity_applications')
      .select('*')
      .eq('id', appId)
      .eq('applicant_id', user.id)
      .single()

    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    if (app.pipeline_stage !== 'draft') {
      return NextResponse.json({ error: 'Application already submitted' }, { status: 400 })
    }

    const [{ data: opp }, { data: questions }] = await Promise.all([
      supabase.from('opportunities').select('*').eq('id', app.opportunity_id).single(),
      supabase
        .from('opportunity_application_questions')
        .select('*')
        .eq('opportunity_id', app.opportunity_id),
    ])

    if (!opp) return NextResponse.json({ error: 'Opportunity no longer exists' }, { status: 404 })

    // 2. Deep Validation
    const errors: { field: string; message: string; step: string }[] = []

    // A. Deadline / Status checks
    if (!opp.applications_open || !['active', 'closing-soon'].includes(opp.status)) {
      return NextResponse.json(
        { error: 'Applications are currently closed for this opportunity.' },
        { status: 400 }
      )
    }
    if (opp.application_deadline && new Date(opp.application_deadline) < new Date()) {
      return NextResponse.json(
        { error: 'The application deadline has passed.' },
        { status: 400 }
      )
    }

    // B. Default Attachments Check
    if (opp.require_resume && !app.resume_url) {
      errors.push({ field: 'resume_url', message: 'Resume URL is required.', step: 'evidence' })
    }
    if (opp.require_portfolio && !app.portfolio_url && !app.website_url) {
      errors.push({
        field: 'portfolio_url',
        message: 'Portfolio or Website URL is required.',
        step: 'evidence',
      })
    }
    if (opp.require_github && !app.github_url) {
      errors.push({ field: 'github_url', message: 'GitHub URL is required.', step: 'evidence' })
    }
    if (opp.require_cover_letter && !app.cover_message && !app.cover_letter) {
      errors.push({ field: 'cover_message', message: 'An intro message is required.', step: 'evidence' })
    }

    // C. Custom Questions Check
    const answers = app.answers || {}
    for (const q of questions || []) {
      if (q.is_required) {
        let isVisible = true
        if (q.conditions?.show_if?.question_id) {
          const c = q.conditions.show_if
          const parentAns = String(answers[c.question_id] || '').toLowerCase()
          const valStr = String(c.value).toLowerCase()
          if (c.operator === 'equals' && parentAns !== valStr) isVisible = false
          if (c.operator === 'not_equals' && parentAns === valStr) isVisible = false
          if (c.operator === 'contains' && !parentAns.includes(valStr)) isVisible = false
        }

        if (isVisible) {
          const ans = answers[q.id]
          const isAnswered =
            ans !== undefined &&
            ans !== null &&
            ans !== '' &&
            (Array.isArray(ans) ? ans.length > 0 : true)
          if (!isAnswered) {
            errors.push({
              field: `q_${q.id}`,
              message: `Required question: "${q.label}"`,
              step: 'questions',
            })
          }
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 })
    }

    // 3. Finalize Submission (Update status to submitted)
    const { data: submitted, error: submitError } = await supabase
      .from('opportunity_applications')
      .update({
        pipeline_stage: 'submitted',
        status: 'pending',
        stage_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', appId)
      .select()
      .single()

    if (submitError) throw submitError

    // 4. Send Message to Employer Inbox (wrapped safely)
    const applicantName =
      app.applicant_snapshot?.full_name || app.applicant_snapshot?.username || 'A builder'
    const messageBody = [
      `${applicantName} just applied to "${opp.title}".`,
      app.cover_message ? `\nMessage:\n${app.cover_message}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    try {
      await supabase.from('inbox_messages').insert({
        recipient_id: opp.poster_user_id,
        sender_id: user.id,
        message_type: 'role_application',
        status: 'unread',
        subject: `New applicant for ${opp.title.slice(0, 180)}`,
        body: messageBody.slice(0, 5000),
        reference_type: 'opportunity',
        reference_id: opp.id,
        reference_name: opp.title,
        reference_slug: opp.slug,
        metadata: {
          opportunity_application_id: app.id,
          opportunity_id: opp.id,
        },
      })
    } catch (e) {
      console.error('Failed to notify owner inbox:', e)
    }

    // 5. Analytics & Recommendation Signals (wrapped safely)
    try {
      await supabase.from('user_activity_signals').insert({
        user_id: user.id,
        signal_type: 'apply_submitted',
        entity_type: 'opportunity',
        entity_id: opp.id,
        weight: 12.0,
      })
    } catch {}

    try {
      await trackOpportunityEvent({
        opportunity_id: opp.id,
        user_id: user.id,
        event_type: 'application_submitted',
        source: 'application_studio',
        metadata: { application_id: app.id },
      })
    } catch {}

    return NextResponse.json({ ok: true, application_id: submitted.id })
  } catch (e: any) {
    console.error('Application submit error:', e)
    return NextResponse.json({ error: e?.message || 'Submission failed' }, { status: 500 })
  }
}