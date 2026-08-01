'use client'

import { useState, useEffect } from 'react'
import { PostComposer } from './PostComposer'
import { PostCard } from './PostCard'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const feedFilters = [
  { id: 'for_you', label: 'For You' },
  { id: 'following', label: 'Following' },
  { id: 'trending', label: 'Trending' },
]

const typeFilters = [
  { id: 'all', label: 'All Types' },
  { id: 'update', label: 'Updates' },
  { id: 'milestone', label: 'Milestones' },
  { id: 'idea', label: 'Ideas' },
  { id: 'looking_for', label: 'Looking For' },
  { id: 'question', label: 'Questions' },
]

export function FeedPage({ initialPosts, currentUser }: any) {
  const [posts, setPosts] = useState(initialPosts)
  const [feedFilter, setFeedFilter] = useState('for_you')
  const [typeFilter, setTypeFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const loadPosts = async (feed: string) => {
    setLoading(true)
    let query = supabase
      .from('posts')
      .select(`
        *,
        users:user_id (id, full_name, username, avatar_url, tagline, brings)
      `)
      .eq('visibility', 'global')
      .order('created_at', { ascending: false })
      .limit(30)

    if (feed === 'following') {
      // Get IDs of users I follow
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser.id)
        .eq('following_type', 'user')

      const followingIds = follows?.map(f => f.following_id) || []
      
      if (followingIds.length === 0) {
        setPosts([])
        setLoading(false)
        return
      }
      
      query = query.in('user_id', followingIds)
    } else if (feed === 'trending') {
      // Sort by engagement (last 7 days)
      query = supabase
        .from('posts')
        .select(`
          *,
          users:user_id (id, full_name, username, avatar_url, tagline, brings)
        `)
        .eq('visibility', 'global')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('like_count', { ascending: false })
        .limit(30)
    }

    const { data: newPosts, error } = await query

    if (error) {
      toast.error('Failed to load posts')
      setLoading(false)
      return
    }

    // Get user likes and bookmarks
    const postIds = newPosts?.map(p => p.id) || []
    const [{ data: likes }, { data: bookmarks }] = await Promise.all([
      supabase.from('post_likes').select('post_id').eq('user_id', currentUser.id).in('post_id', postIds),
      supabase.from('post_bookmarks').select('post_id').eq('user_id', currentUser.id).in('post_id', postIds),
    ])

    const likedSet = new Set(likes?.map(l => l.post_id) || [])
    const bookmarkedSet = new Set(bookmarks?.map(b => b.post_id) || [])

    setPosts((newPosts || []).map(p => ({
      ...p,
      is_liked: likedSet.has(p.id),
      is_bookmarked: bookmarkedSet.has(p.id),
    })))

    setLoading(false)
  }

  useEffect(() => {
    loadPosts(feedFilter)
  }, [feedFilter])

  // Real-time new post subscription
  useEffect(() => {
    const channel = supabase
      .channel('feed-posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: 'visibility=eq.global',
        },
        async (payload) => {
          const newPost = payload.new as any
          const { data: user } = await supabase
            .from('users')
            .select('id, full_name, username, avatar_url, tagline, brings')
            .eq('id', newPost.user_id)
            .single()

          setPosts((prev: any[]) => [{
            ...newPost,
            users: user,
            is_liked: false,
            is_bookmarked: false,
          }, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleNewPost = (post: any) => {
    setPosts((prev: any[]) => [{
      ...post,
      users: {
        id: currentUser.id,
        full_name: currentUser.full_name,
        username: currentUser.username,
        avatar_url: currentUser.avatar_url,
        tagline: currentUser.tagline,
        brings: currentUser.brings,
      },
      is_liked: false,
      is_bookmarked: false,
    }, ...prev])
  }

  const filteredPosts = posts.filter((p: any) => 
    typeFilter === 'all' ? true : p.type === typeFilter
  )

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
      <PostComposer currentUser={currentUser} onPost={handleNewPost} />

      {/* Feed filter tabs */}
      <div className="bg-card border rounded-xl p-1 flex gap-1">
        {feedFilters.map(f => (
          <button
            key={f.id}
            onClick={() => setFeedFilter(f.id)}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-semibold transition-colors',
              feedFilter === f.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {typeFilters.map(f => (
          <button
            key={f.id}
            onClick={() => setTypeFilter(f.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
              typeFilter === f.id
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-card border rounded-2xl p-12 text-center">
            <p className="text-sm text-muted-foreground">Loading posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-card border rounded-2xl p-12 text-center">
            <p className="text-sm text-muted-foreground">
              {feedFilter === 'following' 
                ? "You are not following anyone yet"
                : "No posts to show"
              }
            </p>
            {feedFilter === 'following' && (
              <p className="text-xs text-muted-foreground mt-2">
                Follow people from the Suggested Builders section to see their posts here
              </p>
            )}
          </div>
        ) : (
          filteredPosts.map((post: any) => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUser={currentUser}
              onUpdate={(updatedPost: any) => {
                setPosts((prev: any[]) => 
                  prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p)
                )
              }}
              onDelete={(id: string) => {
                setPosts((prev: any[]) => prev.filter(p => p.id !== id))
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}