import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')
  const uid = user.id

  try {
    const [
      projectsResult,
      draftsResult,
      activityResult,
      analyticsResult,
      viewsOverTimeResult,
      trafficResult,
      audienceResult,
      followingResult,
      statsResult,
    ] = await Promise.all([
      supabase
        .from('projects')
        .select('*, project_members(id, user_id, role), project_roles(id, user_id, role)')
        .or('founder_id.eq.' + uid + ',user_id.eq.' + uid)
        .in('status', ['active', 'paused', 'completed'])
        .not('visibility', 'eq', 'draft')
        .order('last_activity_at', { ascending: false }),

      supabase
        .from('projects')
        .select('*')
        .or('founder_id.eq.' + uid + ',user_id.eq.' + uid)
        .or('visibility.eq.draft,status.eq.draft')
        .order('updated_at', { ascending: false }),

      supabase
        .from('project_activity')
        .select('*, actor:users!project_activity_actor_id_fkey(id, full_name, username, avatar_url)')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(20),

      supabase.rpc('get_project_analytics_summary', { p_user_id: uid, p_days: days }),

      supabase.rpc('get_project_views_over_time', { p_user_id: uid, p_days: days }),

      supabase.rpc('get_project_traffic_sources', { p_user_id: uid, p_days: days }),

      supabase.rpc('get_project_audience', { p_user_id: uid, p_days: days }),

      supabase
        .from('follows')
        .select('following_id, created_at, project:projects!inner(id, slug, name, tagline, icon, color, stage, project_number, cover_image_url, team_size, open_roles, view_count, follower_count, last_activity_at, founder:users!projects_founder_id_fkey(id, full_name, username, avatar_url))')
        .eq('follower_id', uid)
        .eq('following_type', 'project')
        .order('created_at', { ascending: false })
        .limit(20),

      supabase
        .from('projects')
        .select('id, follower_count, application_count, open_roles, recruiting_count, status')
        .or('founder_id.eq.' + uid + ',user_id.eq.' + uid),
    ])

    const allProjects = statsResult.data || []
    const totalProjects = allProjects.length
    const activeProjects = allProjects.filter((p: any) => p.status === 'active').length
    const totalFollowers = allProjects.reduce((s: number, p: any) => s + (p.follower_count || 0), 0)
    const totalApplications = allProjects.reduce((s: number, p: any) => s + (p.application_count || 0), 0)
    const totalRecruiting = allProjects.reduce((s: number, p: any) => s + (p.open_roles || 0), 0)

    const publishedProjects = projectsResult.data || []
    let totalTeamMembers = 0
    for (const p of publishedProjects) {
      const members = new Set<string>()
      if ((p as any).founder_id) members.add((p as any).founder_id)
      if ((p as any).user_id) members.add((p as any).user_id)
      for (const m of ((p as any).project_members || [])) {
        if (m.user_id) members.add(m.user_id)
      }
      for (const r of ((p as any).project_roles || [])) {
        if (r.user_id) members.add(r.user_id)
      }
      totalTeamMembers += members.size
    }

    return NextResponse.json({
      projects: publishedProjects,
      drafts: draftsResult.data || [],
      activity: activityResult.data || [],
      analytics: analyticsResult.data || {},
      viewsOverTime: viewsOverTimeResult.data || [],
      trafficSources: trafficResult.data || [],
      audienceBreakdown: audienceResult.data || [],
      following: (followingResult.data || []).map((f: any) => f.project).filter(Boolean),
      stats: {
        totalProjects,
        activeProjects,
        totalFollowers,
        totalApplications,
        totalTeamMembers,
        totalRecruiting,
      },
    })
  } catch (error: any) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
