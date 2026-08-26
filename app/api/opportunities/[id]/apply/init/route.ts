import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackOpportunityEvent } from '@/lib/events/opportunity-events'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: opp } = await supabase
      .from('opportunities')
      .select('id, poster_user_id, status, applications_open, application_deadline, max_applications, application_count')
      .eq('id', id)
      .single()

    if (!opp) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (opp.poster_user_id === user.id) return NextResponse.json({ error: 'Cannot apply to your own opportunity' }, { status: 400 })
    if (!opp.applications_open || !['active', 'closing-soon'].includes(opp.status)) {
      return NextResponse.json({ error: 'Applications are closed' }, { status: 400 })
    }

    // 1. Check if application already exists
    const { data: existing } = await supabase
      .from('opportunity_applications')
      .select('id, pipeline_stage')
      .eq('opportunity_id', id)
      .eq('applicant_id', user.id)
      .maybeSingle()

    if (existing) {
      if (existing.pipeline_stage !== 'draft' && existing.pipeline_stage !== 'withdrawn') {
        return NextResponse.json({ error: 'Already applied', application_id: existing.id, status: existing.pipeline_stage }, { status: 409 })
      }
      if (existing.pipeline_stage === 'draft') {
        return NextResponse.json({ application_id: existing.id })
      }
    }

    // 2. Snapshot current profile to seed the draft
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, username, avatar_url, tagline, bio, location, is_verified, profile_tags, linkedin_url, github_url, website')
      .eq('id', user.id)
      .single()

    const snapshot = {
      ...profile,
      snapshot_at: new Date().toISOString(),
    }

    // 3. Create Draft
    const { data: draft, error } = await supabase
      .from('opportunity_applications')
      .insert({
        opportunity_id: id,
        applicant_id: user.id,
        pipeline_stage: 'draft',
        status: 'draft',
        applicant_snapshot: snapshot,
        github_url: profile?.github_url || null,
        linkedin_url: profile?.linkedin_url || null,
        website_url: profile?.website || null,
        highlighted_skills: profile?.profile_tags || [],
      })
      .select('id')
      .single()

    if (error) throw error

    await trackOpportunityEvent({
      opportunity_id: id,
      user_id: user.id,
      event_type: 'application_started',
      source: 'application_studio',
      metadata: { application_id: draft.id },
    }).catch(() => {})

    return NextResponse.json({ application_id: draft.id })
  } catch (e: any) {
    console.error('Init application error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to start application' }, { status: 500 })
  }
}