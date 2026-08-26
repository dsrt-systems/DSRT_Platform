import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: opps } = await supabase
    .from('opportunities')
    .select('id, status, view_count, application_count, qualified_count, shortlisted_count, interviewing_count, selected_count, published_at, application_deadline, updated_at, created_at')
    .eq('poster_user_id', user.id)

  const list = opps || []

  const activeIds = list
    .filter(o => ['active', 'closing-soon'].includes(o.status))
    .map(o => o.id)

  // Applications aggregates across owned opps
  let awaitingReview = 0
  let activeConversations = 0
  let completedOutcomes = 0
  let newApplicationsWindow = 0

  if (list.length > 0) {
    const oppIds = list.map(o => o.id)
    const since = new Date(Date.now() - 30 * 86400000).toISOString()

    const [{ data: pending }, { data: recent }, { data: convo }, { data: completed }] = await Promise.all([
      supabase.from('opportunity_applications').select('id', { count: 'exact', head: true }).in('opportunity_id', oppIds).eq('pipeline_stage', 'submitted'),
      supabase.from('opportunity_applications').select('id', { count: 'exact', head: true }).in('opportunity_id', oppIds).gte('created_at', since),
      supabase.from('opportunity_applications').select('id', { count: 'exact', head: true }).in('opportunity_id', oppIds).in('pipeline_stage', ['interview', 'offer']),
      supabase.from('opportunity_applications').select('id', { count: 'exact', head: true }).in('opportunity_id', oppIds).eq('pipeline_stage', 'accepted'),
    ])

    awaitingReview = pending?.length ?? (pending as any)?.count ?? 0
    // The Supabase JS may not expose count directly with head:true; do explicit count queries:
    const c1 = await supabase.from('opportunity_applications').select('*', { count: 'exact', head: true }).in('opportunity_id', oppIds).eq('pipeline_stage', 'submitted')
    const c2 = await supabase.from('opportunity_applications').select('*', { count: 'exact', head: true }).in('opportunity_id', oppIds).gte('created_at', since)
    const c3 = await supabase.from('opportunity_applications').select('*', { count: 'exact', head: true }).in('opportunity_id', oppIds).in('pipeline_stage', ['interview','offer'])
    const c4 = await supabase.from('opportunity_applications').select('*', { count: 'exact', head: true }).in('opportunity_id', oppIds).eq('pipeline_stage', 'accepted')

    awaitingReview = c1.count || 0
    newApplicationsWindow = c2.count || 0
    activeConversations = c3.count || 0
    completedOutcomes = c4.count || 0
  }

  return NextResponse.json({
    metrics: {
      active_opportunities: activeIds.length,
      new_applications: newApplicationsWindow,
      awaiting_review: awaitingReview,
      active_conversations: activeConversations,
      completed_outcomes: completedOutcomes,
    },
  })
}