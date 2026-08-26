import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackOpportunityEvent, writeOpportunityAudit } from '@/lib/events/opportunity-events'

export const dynamic = 'force-dynamic'

const STAGE_TO_EVENT: Record<string, string> = {
  shortlisted: 'applicant_shortlisted',
  declined: 'applicant_rejected',
  interview: 'interview_started',
  accepted: 'applicant_selected',
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const ids: string[] = Array.isArray(body.application_ids) ? body.application_ids.filter(Boolean) : []
  const action: string = String(body.action || '')
  if (ids.length === 0) return NextResponse.json({ error: 'application_ids required' }, { status: 400 })
  if (ids.length > 200) return NextResponse.json({ error: 'Too many ids' }, { status: 400 })

  try {
    const { data: apps } = await supabase
      .from('opportunity_applications')
      .select('id, opportunity_id, pipeline_stage')
      .in('id', ids)

    if (!apps || apps.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const oppIds = [...new Set(apps.map(a => a.opportunity_id))]
    const { data: owned } = await supabase
      .from('opportunities')
      .select('id')
      .in('id', oppIds)
      .eq('poster_user_id', user.id)
    const ownedSet = new Set((owned || []).map((o: any) => o.id))

    const authorized = apps.filter(a => ownedSet.has(a.opportunity_id))
    if (authorized.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let updated = 0

    if (action === 'set_stage') {
      const stage = String(body.stage || '')
      const valid = ['submitted', 'under-review', 'shortlisted', 'interview', 'offer', 'accepted', 'declined', 'withdrawn']
      if (!valid.includes(stage)) return NextResponse.json({ error: 'Invalid stage' }, { status: 400 })

      const patch: any = {
        pipeline_stage: stage,
        stage_updated_at: new Date().toISOString(),
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      if (stage === 'accepted') patch.status = 'accepted'
      else if (stage === 'declined') patch.status = 'declined'
      else if (stage === 'withdrawn') patch.status = 'withdrawn'
      else patch.status = 'pending'

      const authorizedIds = authorized.map(a => a.id)
      const { data: rows, error } = await supabase
        .from('opportunity_applications')
        .update(patch)
        .in('id', authorizedIds)
        .select('id, opportunity_id')
      if (error) throw error
      updated = rows?.length || 0

      // Audit + event per app (best-effort)
      for (const row of rows || []) {
        const before = authorized.find(a => a.id === row.id)?.pipeline_stage
        await writeOpportunityAudit({
          opportunity_id: row.opportunity_id,
          actor_id: user.id,
          action: `applicant_stage_${stage}`,
          target_type: 'application',
          target_id: row.id,
          before_state: { pipeline_stage: before },
          after_state: { pipeline_stage: stage },
          reason: 'cross_opp_bulk',
        }).catch(() => {})
        const evt = STAGE_TO_EVENT[stage]
        if (evt) {
          await trackOpportunityEvent({
            opportunity_id: row.opportunity_id,
            user_id: user.id,
            event_type: evt as any,
            source: 'applications_bulk',
            metadata: { application_id: row.id, from_stage: before, to_stage: stage },
          }).catch(() => {})
        }
      }

      return NextResponse.json({ ok: true, updated, skipped: ids.length - authorized.length })
    }

    if (action === 'star') {
      const flag = !!body.value
      const authorizedIds = authorized.map(a => a.id)
      const { data: rows, error } = await supabase
        .from('opportunity_applications')
        .update({ is_starred: flag, updated_at: new Date().toISOString() })
        .in('id', authorizedIds)
        .select('id')
      if (error) throw error
      return NextResponse.json({ ok: true, updated: rows?.length || 0 })
    }

    if (action === 'assign_reviewer') {
      const reviewerId: string = String(body.reviewer_id || '')
      if (!reviewerId) return NextResponse.json({ error: 'reviewer_id required' }, { status: 400 })

      const rowsToInsert = authorized.map(a => ({
        application_id: a.id,
        opportunity_id: a.opportunity_id,
        reviewer_id: reviewerId,
        assigned_by: user.id,
      }))
      const { error } = await supabase
        .from('opportunity_application_reviewers')
        .upsert(rowsToInsert, { onConflict: 'application_id,reviewer_id' })
      if (error) throw error
      return NextResponse.json({ ok: true, updated: rowsToInsert.length })
    }

    if (action === 'unassign_reviewer') {
      const reviewerId: string = String(body.reviewer_id || '')
      if (!reviewerId) return NextResponse.json({ error: 'reviewer_id required' }, { status: 400 })
      const authorizedIds = authorized.map(a => a.id)
      const { error } = await supabase
        .from('opportunity_application_reviewers')
        .delete()
        .in('application_id', authorizedIds)
        .eq('reviewer_id', reviewerId)
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    console.error('applications bulk error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}