import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { BuilderProfile } from '@/components/profile/BuilderProfile'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: { username: string } }) {
  const supabase = createClient()
  const { data: { user: currentAuthUser } } = await supabase.auth.getUser()

  if (params.username === 'me') {
    if (!currentAuthUser) redirect('/login')
    const { data: myProfile } = await supabase.from('users').select('username').eq('id', currentAuthUser.id).single()
    if (myProfile?.username) redirect(`/profile/${myProfile.username}`)
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('username', params.username)
    .single()

  if (!profile) notFound()

  const isOwner = currentAuthUser?.id === profile.id

  const [
    badgesRes,
    educationRes,
    experienceRes,
    skillsRes,
    projectsRes,
    venturesRes,
    communitiesRes,
    activeBuildingRes,
    followersRes,
    followingRes,
    isFollowingRes,
    featuredItemsRes,
    autoAchievementsRes,
    customAchievementsRes,
    activityPostsRes,
    connectionsRes,
    followerListRes,
    followingListRes,
  ] = await Promise.all([
    supabase.from('user_badges').select('*').eq('user_id', profile.id).eq('is_visible', true).order('awarded_at', { ascending: false }),
    supabase.from('user_education').select('*').eq('user_id', profile.id).order('start_year', { ascending: false }),
    supabase.from('user_experience').select('*').eq('user_id', profile.id).order('start_date', { ascending: false }),
    supabase.from('user_skills').select('*, skills:skill_id(id, name, category)').eq('user_id', profile.id),
    supabase.from('projects').select('id, name, slug, tagline, description, icon, color, sector, category, tech_stack, cover_image_url, is_featured, featured_position, traction_score, created_at, progress_percent, stage, status').or(`founder_id.eq.${profile.id},user_id.eq.${profile.id}`).order('is_featured', { ascending: false }).order('created_at', { ascending: false }).limit(50),
    supabase.from('ventures').select('id, name, slug, tagline, description, industry, sector, logo_url, is_featured, featured_position, follower_count, created_at, stage, status').or(`founder_id.eq.${profile.id},user_id.eq.${profile.id}`).order('is_featured', { ascending: false }).order('created_at', { ascending: false }).limit(50),
    supabase.from('community_members').select('role, joined_at, communities:community_id(id, name, slug, cover_url, icon, icon_color, member_count, is_verified, description)').eq('user_id', profile.id).limit(50),
    profile.actively_building_id && profile.actively_building_type === 'project'
      ? supabase.from('projects').select('id, name, slug, tagline, icon, color, progress_percent, stage, sector').eq('id', profile.actively_building_id).maybeSingle()
      : profile.actively_building_id && profile.actively_building_type === 'venture'
      ? supabase.from('ventures').select('id, name, slug, tagline, logo_url, stage, industry, follower_count').eq('id', profile.actively_building_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_type', 'user').eq('following_id', profile.id),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', profile.id).eq('following_type', 'user'),
    currentAuthUser && !isOwner
      ? supabase.from('follows').select('id').eq('follower_id', currentAuthUser.id).eq('following_type', 'user').eq('following_id', profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('featured_items').select('*').eq('user_id', profile.id).order('position', { ascending: true }).limit(30),
    supabase.from('journey_events').select('*').eq('user_id', profile.id).eq('visible', true).in('category', ['achievement', 'award', 'milestone', 'hackathon', 'certification', 'publication']).order('event_date', { ascending: false }).limit(30),
    supabase.from('user_achievements').select('*').eq('user_id', profile.id).eq('is_visible', true).order('date_awarded', { ascending: false }).limit(30),
    supabase.from('posts').select('id, title, content, media_urls, image_urls, tags, post_category, like_count, comment_count, is_pinned, created_at').eq('user_id', profile.id).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(20),
    supabase.from('builder_connections').select('id').or(`requester_id.eq.${profile.id},recipient_id.eq.${profile.id}`).eq('status', 'accepted'),
    supabase.from('follows').select('users:follower_id(id, full_name, username, avatar_url, tagline)').eq('following_type', 'user').eq('following_id', profile.id).limit(6),
    supabase.from('follows').select('users:following_id(id, full_name, username, avatar_url, tagline)').eq('follower_id', profile.id).eq('following_type', 'user').limit(6),
  ])

  const activelyBuilding = activeBuildingRes.data ? {
    type: profile.actively_building_type,
    entity: activeBuildingRes.data,
  } : null

  const { data: institution } = profile.institution_id
    ? await supabase.from('institutions').select('id, name, short_name, logo_url').eq('id', profile.institution_id).single()
    : { data: null }

  // Combine auto + custom achievements
  const allAchievements = [
    ...(customAchievementsRes.data || []).map((a: any) => ({ ...a, source: 'custom' })),
    ...(autoAchievementsRes.data || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      category: a.category,
      date_awarded: a.event_date,
      source: 'auto',
      icon: 'Trophy',
      color: 'yellow',
    })),
  ].sort((a, b) => {
    const dateA = a.date_awarded ? new Date(a.date_awarded).getTime() : 0
    const dateB = b.date_awarded ? new Date(b.date_awarded).getTime() : 0
    return dateB - dateA
  })

  return (
    <BuilderProfile
      profile={{ ...profile, institution }}
      isOwner={isOwner}
      badges={badgesRes.data || []}
      education={educationRes.data || []}
      experience={experienceRes.data || []}
      skills={skillsRes.data || []}
      projects={projectsRes.data || []}
      ventures={venturesRes.data || []}
      communities={(communitiesRes.data || []).map((c: any) => ({ ...c.communities, role: c.role, joined_at: c.joined_at }))}
      activelyBuilding={activelyBuilding}
      followerCount={followersRes.count || 0}
      followingCount={followingRes.count || 0}
      isFollowing={!!isFollowingRes.data}
      featuredItems={featuredItemsRes.data || []}
      achievements={allAchievements}
      activityPosts={activityPostsRes.data || []}
      currentUserId={currentAuthUser?.id || null}
      connectionCount={connectionsRes.data?.length || 0}
      followerList={(followerListRes.data || []).map((f: any) => f.users).filter(Boolean)}
      followingList={(followingListRes.data || []).map((f: any) => f.users).filter(Boolean)}
    />
  )
}