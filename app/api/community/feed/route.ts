import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tab = searchParams.get('tab') || 'for_you'
  const category = searchParams.get('category') || ''
  const skill = searchParams.get('skill') || ''
  const goal = searchParams.get('goal') || ''
  const location = searchParams.get('location') || ''
  const community = searchParams.get('community') || ''
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  // Get user profile for algorithm
  const { data: profile } = await supabase
    .from('users')
    .select('interest_topics, brings, seeking, location')
    .eq('id', user.id)
    .single()

  // Get user's skills
  const { data: userSkills } = await supabase
    .from('user_skills')
    .select('skills(name)')
    .eq('user_id', user.id)

  const userSkillNames = userSkills?.map((s: any) => s.skills?.name).filter(Boolean) || []

  // Get who user follows
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)
    .eq('following_type', 'user')

  const followingIds = following?.map(f => f.following_id) || []

  // Build query based on tab
  let query = supabase
    .from('posts')
    .select(`
      *,
      users:user_id (id, full_name, username, avatar_url, tagline, brings, location)
    `)
    .eq('visibility', 'global')
    .order('created_at', { ascending: false })

  // Tab-specific filtering
  if (tab === 'projects') {
    query = query.eq('post_category', 'project')
  } else if (tab === 'ventures') {
    query = query.eq('post_category', 'venture')
  } else if (tab === 'looking_for') {
    query = query.eq('post_category', 'looking_for')
  } else if (tab === 'events') {
    query = query.in('post_category', ['event', 'hackathon'])
  } else if (tab === 'discussions') {
    query = query.in('post_category', ['discussion', 'post'])
  } else if (tab === 'opportunities') {
    query = query.in('post_category', ['opportunity', 'looking_for'])
  }

  // Category filter
  if (category) {
    query = query.eq('sector', category)
  }

  // Skill filter
  if (skill) {
    query = query.contains('skills', [skill])
  }

  // Location filter
  if (location) {
    query = query.ilike('location', `%${location}%`)
  }

  // Community filter
  if (community) {
    query = query.eq('community_id', community)
  }

  query = query.range(offset, offset + limit - 1)

  const { data: posts, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get user's likes and bookmarks
  const postIds = posts?.map(p => p.id) || []
  const [{ data: likes }, { data: bookmarks }] = await Promise.all([
    supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds),
    supabase.from('post_bookmarks').select('post_id').eq('user_id', user.id).in('post_id', postIds),
  ])

  const likedSet = new Set(likes?.map(l => l.post_id) || [])
  const bookmarkedSet = new Set(bookmarks?.map(b => b.post_id) || [])

  // Score and sort for "For You" tab
  let scoredPosts = (posts || []).map(p => ({
    ...p,
    is_liked: likedSet.has(p.id),
    is_bookmarked: bookmarkedSet.has(p.id),
    relevance_score: 0,
  }))

  if (tab === 'for_you' || tab === 'all') {
    scoredPosts = scoredPosts.map(p => {
      let score = 0

      // Interest match
      const postTags = [...(p.tags || []), ...(p.skills || []), p.sector].filter(Boolean).map(t => t.toLowerCase())
      const userInterests = (profile?.interest_topics || []).map(t => t.toLowerCase())
      const sharedInterests = postTags.filter(t => userInterests.includes(t))
      score += sharedInterests.length * 10

      // Skill match
      const postSkills = (p.skills || []).map(s => s.toLowerCase())
      const sharedSkills = postSkills.filter(s => userSkillNames.map(n => n.toLowerCase()).includes(s))
      score += sharedSkills.length * 5

      // Following boost
      if (followingIds.includes(p.user_id)) score += 15

      // Engagement
      score += (p.like_count || 0) * 0.5 + (p.comment_count || 0) * 1 + (p.bookmark_count || 0) * 2

      // Freshness (higher for newer)
      const ageHours = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60)
      score += Math.max(20 - (ageHours / 24) * 2, 0)

      // Same location boost
      if (p.location && profile?.location && p.location.toLowerCase().includes(profile.location.toLowerCase().split(',')[0])) {
        score += 5
      }

      return { ...p, relevance_score: score }
    })

    // Sort by relevance
    scoredPosts.sort((a, b) => b.relevance_score - a.relevance_score)
  }

  return NextResponse.json({
    posts: scoredPosts,
    has_more: (posts?.length || 0) === limit,
  })
}