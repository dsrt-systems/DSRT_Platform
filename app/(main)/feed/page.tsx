import { createClient } from '@/lib/supabase/server'
import { FeedPage as FeedComponent } from '@/components/feed/FeedPage'

export default async function FeedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: initialPosts } = await supabase
    .from('posts')
    .select(`
      *,
      users:user_id (id, full_name, username, avatar_url, tagline, brings)
    `)
    .eq('visibility', 'global')
    .order('created_at', { ascending: false })
    .limit(20)

  // Check which posts user has liked/bookmarked
  const postIds = initialPosts?.map(p => p.id) || []
  const [{ data: userLikes }, { data: userBookmarks }] = await Promise.all([
    supabase.from('post_likes').select('post_id').eq('user_id', user!.id).in('post_id', postIds),
    supabase.from('post_bookmarks').select('post_id').eq('user_id', user!.id).in('post_id', postIds),
  ])

  const likedSet = new Set(userLikes?.map(l => l.post_id) || [])
  const bookmarkedSet = new Set(userBookmarks?.map(b => b.post_id) || [])

  const posts = (initialPosts || []).map(p => ({
    ...p,
    is_liked: likedSet.has(p.id),
    is_bookmarked: bookmarkedSet.has(p.id),
  }))

  return <FeedComponent initialPosts={posts} currentUser={profile} />
}