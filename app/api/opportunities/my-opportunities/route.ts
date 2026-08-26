import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/opportunities/my-opportunities
 *   ?filter=all|active|drafts|paused|closed|archived
 *   ?status=active|paused|... (fine-grained, overrides filter groups if provided)
 *   ?q=<search>
 *   ?linked=project|venture|organization|community|none
 *   ?type=<opportunity_type>
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') || 'all'
  const status = searchParams.get('status')
  const q = searchParams.get('q')?.trim()
  const linked = searchParams.get('linked')
  const type = searchParams.get('type')

  try {
    let query = supabase
      .from('opportunities')
      .select('*, primary_category:opportunity_categories!primary_category_id(name, slug)')
      .eq('poster_user_id', user.id)
      .order('last_activity_at', { ascending: false, nullsFirst: false })

    if (status) {
      query = query.eq('status', status)
    } else {
      if (filter === 'active') query = query.in('status', ['active', 'closing-soon'])
      else if (filter === 'drafts') query = query.eq('status', 'draft')
      else if (filter === 'paused') query = query.eq('status', 'paused')
      else if (filter === 'closed') query = query.in('status', ['closed', 'filled', 'expired'])
      else if (filter === 'archived') query = query.eq('status', 'archived')
    }

    if (type) query = query.eq('opportunity_type', type)
    if (linked === 'project') query = query.not('project_id', 'is', null)
    else if (linked === 'venture') query = query.not('venture_id', 'is', null)
    else if (linked === 'organization') query = query.not('organization_id', 'is', null)
    else if (linked === 'community') query = query.not('community_id', 'is', null)
    else if (linked === 'none') query = query.is('project_id', null).is('venture_id', null).is('organization_id', null).is('community_id', null)

    if (q && q.length >= 2) {
      query = query.or(`title.ilike.%${q}%,opportunity_number.ilike.%${q}%,description.ilike.%${q}%`)
    }

    const { data: items, error } = await query
    if (error) throw error

    const opportunities = items || []
    const projectIds = [...new Set(opportunities.map((o: any) => o.project_id).filter(Boolean))]
    const ventureIds = [...new Set(opportunities.map((o: any) => o.venture_id).filter(Boolean))]

    const [projectsRes, venturesRes] = await Promise.all([
      projectIds.length
        ? supabase.from('projects').select('id, slug, name, icon, cover_image_url').in('id', projectIds)
        : Promise.resolve({ data: [] as any[] }),
      ventureIds.length
        ? supabase.from('ventures').select('id, slug, name, logo_url').in('id', ventureIds)
        : Promise.resolve({ data: [] as any[] }),
    ])

    const projectMap = new Map(((projectsRes.data || []) as any[]).map((p: any) => [p.id, p]))
    const ventureMap = new Map(((venturesRes.data || []) as any[]).map((v: any) => [v.id, v]))

    const stats = {
      total: opportunities.length,
      active: opportunities.filter((o: any) => ['active', 'closing-soon'].includes(o.status)).length,
      drafts: opportunities.filter((o: any) => o.status === 'draft').length,
      paused: opportunities.filter((o: any) => o.status === 'paused').length,
      closed: opportunities.filter((o: any) => ['closed', 'filled', 'expired', 'archived'].includes(o.status)).length,
      total_applications: opportunities.reduce((s: number, o: any) => s + (o.application_count || 0), 0),
      total_qualified: opportunities.reduce((s: number, o: any) => s + (o.qualified_count || 0), 0),
      total_views: opportunities.reduce((s: number, o: any) => s + (o.view_count || 0), 0),
      total_saves: opportunities.reduce((s: number, o: any) => s + (o.save_count || 0), 0),
      avg_conversion: opportunities.length
        ? Math.round((opportunities.reduce((s: number, o: any) => s + Number(o.conversion_rate || 0), 0) / opportunities.length) * 10) / 10
        : 0,
    }

    return NextResponse.json({
      opportunities: opportunities.map((o: any) => ({
        ...o,
        project: o.project_id ? projectMap.get(o.project_id) || null : null,
        venture: o.venture_id ? ventureMap.get(o.venture_id) || null : null,
      })),
      stats,
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message, opportunities: [], stats: {} },
      { status: 500 }
    )
  }
}