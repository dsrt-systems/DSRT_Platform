import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/opportunities/suggested?limit=24
 * Returns personalized suggestions based on user profile signals
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 50)

  if (!user) {
    // Anonymous: return newest featured
    const { data } = await supabase.from('opportunities')
      .select('*')
      .eq('visibility', 'public')
      .in('status', ['active', 'closing-soon'])
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit)
    return NextResponse.json({ opportunities: data || [] })
  }

  try {
    // Get user profile + preferences
    const { data: profile } = await supabase.from('users')
      .select('interest_topics, preferred_categories, preferred_community_ids, focus_sectors, skills')
      .eq('id', user.id)
      .maybeSingle()

    const interests = [
      ...(profile?.interest_topics || []),
      ...(profile?.preferred_categories || []),
      ...(profile?.focus_sectors || []),
    ].filter(Boolean)

    // Get user's skills from user_skills table
    const { data: userSkills } = await supabase.from('user_skills')
      .select('skill_id, skills(name)')
      .eq('user_id', user.id)
      .limit(50)
    const skillNames = (userSkills || [])
      .map((s: any) => s.skills?.name)
      .filter(Boolean)

    // Get already-applied + own opportunities to exclude
    const [{ data: applied }, { data: ownOpps }] = await Promise.all([
      supabase.from('opportunity_applications').select('opportunity_id').eq('applicant_id', user.id),
      supabase.from('opportunities').select('id').eq('poster_user_id', user.id),
    ])
    const excludeIds = [
      ...(applied || []).map((a: any) => a.opportunity_id),
      ...(ownOpps || []).map((o: any) => o.id),
    ]

    // Fetch candidate pool
    let candidatesQuery = supabase.from('opportunities')
      .select('*')
      .eq('visibility', 'public')
      .in('status', ['active', 'closing-soon'])
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(150)

    if (excludeIds.length > 0) {
      candidatesQuery = candidatesQuery.not('id', 'in', '(' + excludeIds.join(',') + ')')
    }

    const { data: candidates } = await candidatesQuery
    let items = candidates || []

    // Score each candidate
    const scored = items.map((opp: any) => {
      let score = 0
      // Freshness
      const ageDays = (Date.now() - new Date(opp.published_at || opp.created_at).getTime()) / 86400000
      if (ageDays < 1) score += 15
      else if (ageDays < 7) score += 8
      else if (ageDays < 30) score += 3

      // Featured
      if (opp.is_featured) score += 12

      // Skill overlap
      if (skillNames.length > 0 && opp.required_skills) {
        const overlap = opp.required_skills.filter((s: string) =>
          skillNames.some((us: string) => us.toLowerCase() === s.toLowerCase())
        ).length
        score += overlap * 8
      }

      // Interest overlap in title/description
      const searchable = (opp.title + ' ' + (opp.subtitle || '') + ' ' + (opp.description || '')).toLowerCase()
      for (const int of interests) {
        if (searchable.includes(String(int).toLowerCase())) {
          score += 5
        }
      }

      // Application activity signal (fewer apps = more accessible)
      if (opp.application_count < 5) score += 3

      return { ...opp, _score: score }
    })

    scored.sort((a: any, b: any) => b._score - a._score)
    const top = scored.slice(0, limit)

    // Enrich (poster, project, venture)
    const posterIds = [...new Set(top.map((i: any) => i.poster_user_id).filter(Boolean))]
    const projectIds = [...new Set(top.map((i: any) => i.project_id).filter(Boolean))]
    const ventureIds = [...new Set(top.map((i: any) => i.venture_id).filter(Boolean))]

    const [postersRes, projectsRes, venturesRes] = await Promise.all([
      posterIds.length ? supabase.from('users').select('id, username, full_name, avatar_url, is_verified, tagline').in('id', posterIds) : { data: [] },
      projectIds.length ? supabase.from('projects').select('id, slug, name, icon, cover_image_url').in('id', projectIds) : { data: [] },
      ventureIds.length ? supabase.from('ventures').select('id, slug, name, logo_url').in('id', ventureIds) : { data: [] },
    ])

    const posterMap = new Map((postersRes.data || []).map((p: any) => [p.id, p]))
    const projectMap = new Map((projectsRes.data || []).map((p: any) => [p.id, p]))
    const ventureMap = new Map((venturesRes.data || []).map((v: any) => [v.id, v]))

    // Which are already saved by user
    const oppIds = top.map((o: any) => o.id)
    const { data: saves } = oppIds.length
      ? await supabase.from('opportunity_saves')
          .select('opportunity_id').eq('user_id', user.id).in('opportunity_id', oppIds)
      : { data: [] }
    const savedSet = new Set((saves || []).map((s: any) => s.opportunity_id))

    const enriched = top.map((item: any) => ({
      ...item,
      poster: posterMap.get(item.poster_user_id) || null,
      project: item.project_id ? projectMap.get(item.project_id) || null : null,
      venture: item.venture_id ? ventureMap.get(item.venture_id) || null : null,
      is_saved: savedSet.has(item.id),
      has_applied: false,
    }))

    return NextResponse.json({ opportunities: enriched })
  } catch (e: any) {
    console.error('Suggested error:', e)
    return NextResponse.json({ opportunities: [], error: e?.message }, { status: 500 })
  }
}