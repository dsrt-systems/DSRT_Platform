import { createClient } from '@/lib/supabase/server'
import { FeedTabs } from '@/components/feed/FeedTabs'
import { ComposeCard } from '@/components/feed/ComposeCard'
import { FeedList } from '@/components/feed/FeedList'

export const revalidate = 60

export default async function FeedPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Always fetch editorials
  const { data: editorialPosts } = await supabase
    .from('editorial_posts')
    .select('*, editorial_categories(*)')
    .order('published_at', { ascending: false })
    .limit(30)

  // Fetch user posts (might be empty for new install)
  const { data: userPosts } = await supabase
    .from('posts')
    .select('*, users(id, full_name, username, avatar_url, tagline, brings)')
    .order('created_at', { ascending: false })
    .limit(30)

  const mixed = mixFeed(userPosts || [], editorialPosts || [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <ComposeCard user={profile} />
      <FeedTabs />
      <FeedList items={mixed} currentUser={profile} />
    </div>
  )
}

function mixFeed(userPosts: any[], editorialPosts: any[]): any[] {
  const mixed: any[] = []
  let editorialIdx = 0
  let userIdx = 0

  // First show 1 editorial at the top (the freshest news)
  if (editorialPosts.length > 0) {
    mixed.push({ kind: 'editorial', data: editorialPosts[editorialIdx++] })
  }

  // Then interleave: every 2 user posts, 1 editorial
  while (userIdx < userPosts.length || editorialIdx < editorialPosts.length) {
    // Add up to 2 user posts
    for (let i = 0; i < 2 && userIdx < userPosts.length; i++) {
      mixed.push({ kind: 'user', data: userPosts[userIdx++] })
    }
    // Then 1 editorial
    if (editorialIdx < editorialPosts.length) {
      mixed.push({ kind: 'editorial', data: editorialPosts[editorialIdx++] })
    }
  }

  return mixed
}