import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  trackOpportunityEvent,
  writeOpportunityAudit,
} from '@/lib/events/opportunity-events'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/opportunities/[id]/applicants/[appId]
 * Owner-only: stage, notes, star, rating
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const { id, appId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: opp } = await supabase
      .from('opportunities')
      .select('poster_user_id')
      .eq('id', id)
      .single()

    if (!opp) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }
    if (opp.poster_user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const {
      pipeline_stage,
      status,
      internal_notes,
      internal_rating,
      is_starred,
    } = body

    const { data: currentApp } = await supabase
      .from('opportunity_applications')
      .select('*')
      .eq('id', appId)
      .eq('opportunity_id', id)
      .single()

    if (!currentApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const update: any = {
      updated_at: new Date().toISOString(),
    }

    if (pipeline_stage !== undefined) {
      update.pipeline_stage = pipeline_stage
      update.stage_updated_at = new Date().toISOString()
      update.reviewed_by = user.id
      update.reviewed_at = new Date().toISOString()

      // Map to valid status check constraint values
      if (pipeline_stage === 'hired') update.status = 'accepted'
      else if (pipeline_stage === 'rejected') update.status = 'rejected'
      else if (pipeline_stage === 'withdrawn') update.status = 'withdrawn'
      else if (status === undefined) update.status = 'under_review'
    }

    if (status !== undefined) update.status = status
    if (internal_notes !== undefined) update.internal_notes = internal_notes
    if (internal_rating !== undefined) update.internal_rating = internal_rating
    if (is_starred !== undefined) update.is_starred = is_starred

    if (!currentApp.first_viewed_at) {
      update.first_viewed_at = new Date().toISOString()
    }

    const { data: updatedApp, error } = await supabase
      .from('opportunity_applications')
      .update(update)
      .eq('id', appId)
      .eq('opportunity_id', id)
      .select()
      .single()

    if (error) throw error

    // History row is also written by DB trigger when pipeline_stage changes.
    // Audit + domain events are app-level.
    if (pipeline_stage && pipeline_stage !== currentApp.pipeline_stage) {
      await writeOpportunityAudit({
        opportunity_id: id,
        actor_id: user.id,
        action: `applicant_stage_${pipeline_stage}`,
        target_type: 'application',
        target_id: appId,
        before_state: { pipeline_stage: currentApp.pipeline_stage },
        after_state: { pipeline_stage },
      })

      const eventMap: Record<string, string> = {
        screening: 'applicant_shortlisted',
        rejected: 'applicant_rejected',
        interviewing: 'interview_started',
        hired: 'applicant_selected',
      }

      if (eventMap[pipeline_stage]) {
        await trackOpportunityEvent({
          opportunity_id: id,
          user_id: user.id,
          event_type: eventMap[pipeline_stage],
          source: 'manage',
          metadata: {
            application_id: appId,
            from_stage: currentApp.pipeline_stage,
            to_stage: pipeline_stage,
          },
        })
      }
    }

    return NextResponse.json({ application: updatedApp })
  } catch (e: any) {
    console.error('Update applicant error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}