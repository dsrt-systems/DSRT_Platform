import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/opportunities/[id]/applicants/[appId]
 * Update pipeline stage, notes, rating, starred
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const { id, appId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Verify owner
    const { data: opp } = await supabase.from('opportunities')
      .select('poster_user_id, title, slug').eq('id', id).single()

    if (!opp || opp.poster_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))

    const updates: any = {
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    }

    if (body.pipeline_stage) {
      const valid = ['submitted', 'viewed', 'under-review', 'shortlisted', 'interview', 'offer', 'accepted', 'declined', 'withdrawn']
      if (!valid.includes(body.pipeline_stage)) {
        return NextResponse.json({ error: 'Invalid stage' }, { status: 400 })
      }
      updates.pipeline_stage = body.pipeline_stage

      // Sync status
      if (body.pipeline_stage === 'accepted') updates.status = 'accepted'
      else if (body.pipeline_stage === 'declined') updates.status = 'declined'
      else if (body.pipeline_stage === 'withdrawn') updates.status = 'withdrawn'
      else updates.status = 'pending'
    }

    if ('internal_notes' in body) updates.internal_notes = body.internal_notes
    if ('internal_rating' in body) updates.internal_rating = body.internal_rating
    if ('is_starred' in body) updates.is_starred = body.is_starred
    if (body.first_viewed_at === true && !updates.first_viewed_at) {
      updates.first_viewed_at = new Date().toISOString()
    }

    const { data: updated, error } = await supabase.from('opportunity_applications')
      .update(updates)
      .eq('id', appId)
      .eq('opportunity_id', id)
      .select('*')
      .single()

    if (error) throw error

    // If accepted/declined, notify applicant via inbox
    if (updates.pipeline_stage === 'accepted' || updates.pipeline_stage === 'declined') {
      const action = updates.pipeline_stage
      await supabase.from('inbox_messages').insert({
        recipient_id: updated.applicant_id,
        sender_id: user.id,
        message_type: 'system',
        status: 'unread',
        subject: 'Your application was ' + action,
        body: action === 'accepted'
          ? 'Great news! Your application for "' + opp.title + '" has been accepted.'
          : 'Your application for "' + opp.title + '" has been reviewed and declined at this time.',
        reference_type: 'opportunity',
        reference_id: id,
        reference_name: opp.title,
        reference_slug: opp.slug,
        metadata: {
          opportunity_application_id: appId,
          opportunity_id: id,
        },
      }).then(() => {}, () => {})
    }

    return NextResponse.json({ application: updated })
  } catch (e: any) {
    console.error('Update applicant error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

/**
 * GET single application (with full status history)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const { id, appId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: app, error } = await supabase.from('opportunity_applications')
      .select('*').eq('id', appId).eq('opportunity_id', id).single()

    if (error || !app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Verify access (owner or applicant)
    const { data: opp } = await supabase.from('opportunities')
      .select('poster_user_id').eq('id', id).single()

    if (!opp || (opp.poster_user_id !== user.id && app.applicant_id !== user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Fetch applicant + history
    const [applicantRes, historyRes] = await Promise.all([
      supabase.from('users')
        .select('id, username, full_name, avatar_url, tagline, bio, is_verified, location, follower_count')
        .eq('id', app.applicant_id).single(),
      supabase.from('opportunity_application_status_history')
        .select('*').eq('application_id', appId).order('changed_at', { ascending: false }),
    ])

    return NextResponse.json({
      ...app,
      applicant: applicantRes.data,
      history: historyRes.data || [],
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}