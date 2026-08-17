import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/opportunities/my-opportunities
 *   ?filter=all|active|drafts|paused|closed|archived
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') || 'all'

  try {
    let query = supabase.from('opportunities')
      .select('*, primary_category:opportunity_categories!primary_category_id(name, slug)')
      .eq('poster_user_id', user.id)
      .order('last_activity_at', { ascending: false, nullsFirst: false })

    if (filter === 'active') query = query.in('status', ['active', 'closing-soon'])
    else if (filter === 'drafts') query = query.eq('status', 'draft')
    else if (filter === 'paused') query = query.eq('status', 'paused')
    else if (filter === 'closed') query = query.in('status', ['closed', 'filled', 'expired'])
    else if (filter === 'archived') query = query.eq('status', 'archived')

    const { data: items, error } = await query
    if (error) throw error

    const opportunities = items || []

    // Enrich with project/venture context
    const projectIds = [...new Set(opportunities.map(o => o.project_id).filter(Boolean))]
    const ventureIds = [...new Set(opportunities.map(o => o.venture_id).filter(Boolean))]

    const [projectsRes, venturesRes] = await Promise.all([
      projectIds.length ? supabase.from('projects').select('id, slug, name, icon, cover_image_url').in('id', projectIds) : { data: [] },
      ventureIds.length ? supabase.from('ventures').select('id, slug, name, logo_url').in('id', ventureIds) : { data: [] },
    ])

    const projectMap = new Map((projectsRes.data || []).map((p: any) => [p.id, p]))
    const ventureMap = new Map((venturesRes.data || []).map((v: any) => [v.id, v]))

    // Stats
    const stats = {
      total: opportunities.length,
      active: opportunities.filter(o => ['active', 'closing-soon'].includes(o.status)).length,
      drafts: opportunities.filter(o => o.status === 'draft').length,
      paused: opportunities.filter(o => o.status === 'paused').length,
      closed: opportunities.filter(o => ['closed', 'filled', 'expired', 'archived'].includes(o.status)).length,
      total_applications: opportunities.reduce((s, o) => s + (o.application_count || 0), 0),
      total_views: opportunities.reduce((s, o) => s + (o.view_count || 0), 0),
      total_saves: opportunities.reduce((s, o) => s + (o.save_count || 0), 0),
    }

    return NextResponse.json({
      opportunities: opportunities.map(o => ({
        ...o,
        project: o.project_id ? projectMap.get(o.project_id) || null : null,
        venture: o.venture_id ? ventureMap.get(o.venture_id) || null : null,
      })),
      stats,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message, opportunities: [], stats: {} }, { status: 500 })
  }
}