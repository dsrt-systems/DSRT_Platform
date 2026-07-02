import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/matching/suggest?type=builders|projects|ventures
export async function GET(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'builders'

  // Get current user profile
  const { data: me } = await supabase
    .from('users')
    .select(
      '*, user_skills(skill_id, skills(name, category)), user_education(institution_id)'
    )
    .eq('id', user.id)
    .single()

  if (!me) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const mySkillIds = me.user_skills?.map((s: any) => s.skill_id) || []
  const myInterests = me.interest_topics || []
  const myInstitutionIds =
    me.user_education?.map((e: any) => e.institution_id).filter(Boolean) || []

  if (type === 'builders') {
    // Find users with overlapping skills or interests, excluding self
    const { data: candidates } = await supabase
      .from('users')
      .select(
        '*, user_skills(skill_id, skills(name)), user_education(institution_id, institutions(name))'
      )
      .neq('id', user.id)
      .eq('onboarding_complete', true)
      .limit(50)

    const scored = (candidates || [])
      .map((c: any) => {
        const theirSkillIds =
          c.user_skills?.map((s: any) => s.skill_id) || []
        const theirInterests = c.interest_topics || []
        const theirInstitutions =
          c.user_education?.map((e: any) => e.institution_id).filter(Boolean) ||
          []

        const skillOverlap = mySkillIds.filter((id: string) =>
          theirSkillIds.includes(id)
        ).length
        const interestOverlap = myInterests.filter((t: string) =>
          theirInterests.includes(t)
        ).length
        const sameInstitution = myInstitutionIds.some((id: string) =>
          theirInstitutions.includes(id)
        )

        // Score: skill complementarity (different skills) bonus + interest overlap + institution bonus
        const score =
          skillOverlap * 3 +
          interestOverlap * 4 +
          (sameInstitution ? 10 : 0) +
          // Bonus for complementary brings
          (c.brings?.some(
            (b: string) =>
              !me.brings?.includes(b) &&
              (me.seeking?.includes(b) ||
                ['builder', 'visionary', 'launcher'].includes(b))
          )
            ? 8
            : 0)

        const reasons = []
        if (sameInstitution) reasons.push('Same institution')
        if (interestOverlap > 0)
          reasons.push(`${interestOverlap} shared interests`)
        if (skillOverlap > 0) reasons.push(`${skillOverlap} shared skills`)

        return {
          user: c,
          score,
          reasons,
        }
      })
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)

    return NextResponse.json({ items: scored })
  }

  if (type === 'projects') {
    const { data: projects } = await supabase
      .from('projects')
      .select('*, users:creator_id(id, full_name, username, avatar_url)')
      .eq('is_open', true)
      .neq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    const scored = (projects || [])
      .map((p: any) => {
        const categoryMatch = p.category?.some((c: string) =>
          myInterests.some((i: string) =>
            c.toLowerCase().includes(i.toLowerCase())
          )
        )
          ? 5
          : 0
        const score = categoryMatch + (p.is_hiring ? 3 : 0)

        return { project: p, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)

    return NextResponse.json({ items: scored })
  }

  if (type === 'ventures') {
    const { data: ventures } = await supabase
      .from('startups')
      .select('*, users:founder_id(id, full_name, username, avatar_url)')
      .neq('founder_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    const scored = (ventures || [])
      .map((v: any) => {
        const sectorMatch = v.category?.some((c: string) =>
          myInterests.some((i: string) =>
            c.toLowerCase().includes(i.toLowerCase())
          )
        )
          ? 5
          : 0
        return { venture: v, score: sectorMatch }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)

    return NextResponse.json({ items: scored })
  }

  return NextResponse.json({ items: [] })
}