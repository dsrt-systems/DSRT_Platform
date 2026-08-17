import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/opportunities/my-applications
 *   ?stage=all|submitted|viewed|shortlisted|interview|accepted|declined|withdrawn
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const stage = searchParams.get('stage')

  try {
    let query = supabase.from('opportunity_applications')
      .select('*')
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false })

    if (stage && stage !== 'all') {
      query = query.eq('pipeline_stage', stage)
    }

    const { data: apps, error } = await query
    if (error) throw error

    const items = apps || []
    const oppIds = [...new Set(items.map(a => a.opportunity_id))]

    const { data: opportunities } = oppIds.length
      ? await supabase.from('opportunities')
          .select('id, slug, title, subtitle, opportunity_type, status, cover_image_url, poster_user_id, project_id, venture_id')
          .in('id', oppIds)
      : { data: [] }

    const opps = opportunities || []
    const posterIds = [...new Set(opps.map((o: any) => o.poster_user_id).filter(Boolean))]
    const projectIds = [...new Set(opps.map((o: any) => o.project_id).filter(Boolean))]
    const ventureIds = [...new Set(opps.map((o: any) => o.venture_id).filter(Boolean))]

    const [postersRes, projectsRes, venturesRes] = await Promise.all([
      posterIds.length ? supabase.from('users').select('id, username, full_name, avatar_url').in('id', posterIds) : { data: [] },
      projectIds.length ? supabase.from('projects').select('id, slug, name, icon').in('id', projectIds) : { data: [] },
      ventureIds.length ? supabase.from('ventures').select('id, slug, name, logo_url').in('id', ventureIds) : { data: [] },
    ])

    const posterMap = new Map((postersRes.data || []).map((p: any) => [p.id, p]))
    const projectMap = new Map((projectsRes.data || []).map((p: any) => [p.id, p]))
    const ventureMap = new Map((venturesRes.data || []).map((v: any) => [v.id, v]))
    const oppMap = new Map(opps.map((o: any) => [o.id, {
      ...o,
      poster: posterMap.get(o.poster_user_id) || null,
      project: o.project_id ? projectMap.get(o.project_id) || null : null,
      venture: o.venture_id ? ventureMap.get(o.venture_id) || null : null,
    }]))

    // Stats
    const stats: Record<string, number> = { total: items.length }
    for (const a of items) {
      stats[a.pipeline_stage] = (stats[a.pipeline_stage] || 0) + 1
    }

    return NextResponse.json({
      applications: items.map(app => ({
        ...app,
        opportunity: oppMap.get(app.opportunity_id) || null,
      })),
      stats,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message, applications: [], stats: {} }, { status: 500 })
  }
}