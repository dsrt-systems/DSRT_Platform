import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('interest_topics, brings, seeking, location')
    .eq('id', user.id)
    .single()

  // Get user skills
  const { data: userSkills } = await supabase
    .from('user_skills')
    .select('skills(name, category)')
    .eq('user_id', user.id)

  const skillNames = userSkills?.map((s: any) => s.skills?.name).filter(Boolean) || []
  const skillCategories = [...new Set(userSkills?.map((s: any) => s.skills?.category).filter(Boolean) || [])]

  // Get who user already follows
  const { data: alreadyFollowing } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)
    .eq('following_type', 'user')

  const followingIds = [...(alreadyFollowing?.map(f => f.following_id) || []), user.id]

  // Get candidates
  const { data: candidates } = await supabase
    .from('users')
    .select(`
      id, full_name, username, avatar_url, tagline, brings, 
      interest_topics, location, follower_count, execution_score,
      user_skills (skills(name, category))
    `)
    .eq('onboarding_complete', true)
    .not('id', 'in', `(${followingIds.join(',')})`)
    .limit(50)

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ builders: [] })
  }

  // Score each candidate
  const scored = candidates.map(candidate => {
    let score = 0
    let reasons: string[] = []

    // Shared interests
    const candidateInterests = candidate.interest_topics || []
    const userInterests = profile?.interest_topics || []
    const sharedInterests = candidateInterests.filter((i: string) => userInterests.includes(i))
    score += sharedInterests.length * 15
    if (sharedInterests.length > 0) reasons.push('Shared interests')

    // Complementary roles
    const userBrings = profile?.brings || []
    const candidateBrings = candidate.brings || []
    const complementary = 
      (userBrings.includes('visionary') && candidateBrings.includes('builder')) ||
      (userBrings.includes('builder') && candidateBrings.includes('visionary')) ||
      (userBrings.includes('builder') && candidateBrings.includes('launcher')) ||
      (userBrings.includes('launcher') && candidateBrings.includes('builder'))
    if (complementary) {
      score += 25
      reasons.push('Complementary skills')
    }

    // Shared skill categories
    const candidateSkills = candidate.user_skills?.map((s: any) => s.skills?.name).filter(Boolean) || []
    const candidateSkillCats = [...new Set(candidate.user_skills?.map((s: any) => s.skills?.category).filter(Boolean) || [])]
    const sharedCats = candidateSkillCats.filter(c => skillCategories.includes(c))
    score += sharedCats.length * 8
    if (sharedCats.length > 0 && !reasons.includes('Shared interests')) reasons.push('Similar domain')

    // Same location
    if (candidate.location && profile?.location) {
      const userCity = profile.location.split(',')[0]?.trim().toLowerCase()
      const candidateCity = candidate.location.split(',')[0]?.trim().toLowerCase()
      if (userCity && candidateCity && userCity === candidateCity) {
        score += 10
        reasons.push('Same city')
      }
    }

    // Activity bonus
    if (candidate.execution_score > 100) score += 5
    if (candidate.follower_count > 50) score += 5

    // Match percentage (normalize to 0-100)
    const matchPercent = Math.min(Math.round(score), 99)

    return {
      ...candidate,
      match_score: matchPercent,
      match_reason: reasons[0] || 'Active builder',
      top_skills: candidateSkills.slice(0, 3),
      user_skills: undefined, // Remove raw data
    }
  })

  // Sort by score, take top 8
  scored.sort((a, b) => b.match_score - a.match_score)

  return NextResponse.json({
    builders: scored.slice(0, 8),
  })
}