import { createClient } from '@/lib/supabase/server'
import { FeedTabs } from '@/components/feed/FeedTabs'
import { ComposeCard } from '@/components/feed/ComposeCard'
import { FeedList } from '@/components/feed/FeedList'
import { DailyBriefing } from '@/components/feed/DailyBriefing'
import { AutoRefresh } from '@/components/feed/AutoRefresh'

export const revalidate = 0
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface PageProps {
  searchParams: { tab?: string }
}

export default async function FeedPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single()

  const tab = searchParams.tab || 'global'

  const { data: editorialPosts } = await supabase
    .from('editorial_posts')
    .select('*, editorial_categories(*)')
    .order('published_at', { ascending: false })
    .limit(50)

  let userPosts: any[] = []

  if (tab === 'following') {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user!.id)
      .eq('following_type', 'user')

    const followingIds = (follows || []).map((f) => f.following_id)

    if (followingIds.length > 0) {
      const { data } = await supabase
        .from('posts')
        .select(
          '*, users(id, full_name, username, avatar_url, tagline, brings, is_bot)'
        )
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(40)
      userPosts = data || []
    }
  } else if (tab === 'community') {
    const { data: education } = await supabase
      .from('user_education')
      .select('institution_id')
      .eq('user_id', user!.id)

    const instIds = (education || [])
      .map((e) => e.institution_id)
      .filter(Boolean)

    if (instIds.length > 0) {
      const { data: peers } = await supabase
        .from('user_education')
        .select('user_id')
        .in('institution_id', instIds)

      const peerIds = Array.from(
        new Set((peers || []).map((p) => p.user_id))
      ).filter((id) => id !== user!.id)

      if (peerIds.length > 0) {
        const { data } = await supabase
          .from('posts')
          .select(
            '*, users(id, full_name, username, avatar_url, tagline, brings, is_bot)'
          )
          .in('user_id', peerIds)
          .order('created_at', { ascending: false })
          .limit(40)
        userPosts = data || []
      }
    }
  } else {
    const { data } = await supabase
      .from('posts')
      .select(
        '*, users(id, full_name, username, avatar_url, tagline, brings, is_bot)'
      )
      .order('created_at', { ascending: false })
      .limit(40)
    userPosts = data || []
  }

  const shuffled = shuffleByTimeSlot(editorialPosts || [])
  const mixed = mixFeed(userPosts, tab === 'global' ? shuffled : [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <AutoRefresh />
      <DailyBriefing />
      <ComposeCard user={profile} />
      <FeedTabs />

      {tab !== 'global' && userPosts.length === 0 && (
        <div className="rounded-2xl border border-border/40 bg-card/40 p-12 text-center space-y-3">
          <div className="text-4xl">
            {tab === 'following' ? '👥' : '🏛️'}
          </div>
          <h3 className="font-semibold">
            {tab === 'following'
              ? 'No posts from people you follow'
              : 'No posts from your community'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {tab === 'following'
              ? 'Follow builders to see their posts here.'
              : 'Add your institution in your profile to see posts from peers.'}
          </p>
        </div>
      )}

      <FeedList items={mixed} currentUser={profile} />
    </div>
  )
}

function shuffleByTimeSlot<T>(arr: T[]): T[] {
  const timeSlot = Math.floor(Date.now() / (1000 * 60 * 30))
  const seeded = [...arr]
  let seed = timeSlot

  for (let i = seeded.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280
    const j = Math.floor((seed / 233280) * (i + 1))
    ;[seeded[i], seeded[j]] = [seeded[j], seeded[i]]
  }

  return seeded
}

function mixFeed(userPosts: any[], editorialPosts: any[]): any[] {
  const mixed: any[] = []
  let editorialIdx = 0
  let userIdx = 0

  if (editorialPosts.length > 0) {
    mixed.push({ kind: 'editorial', data: editorialPosts[editorialIdx++] })
  }

  while (userIdx < userPosts.length || editorialIdx < editorialPosts.length) {
    for (let i = 0; i < 2 && userIdx < userPosts.length; i++) {
      mixed.push({ kind: 'user', data: userPosts[userIdx++] })
    }
    if (editorialIdx < editorialPosts.length) {
      mixed.push({ kind: 'editorial', data: editorialPosts[editorialIdx++] })
    }
  }

  return mixed.slice(0, 40)
}