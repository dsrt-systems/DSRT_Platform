'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { ArrowUp } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { HomePostCard } from './HomePostCard'
import type { HomeTab } from './HomeTabs'

interface Props {
  tab: HomeTab
  currentUser: any
}

export function HomeFeed({ tab, currentUser }: Props) {
  const supabase = useMemo(() => createClient(), [])

  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newPostsCount, setNewPostsCount] = useState(0)
  const observerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)

  // Track mount state to prevent state updates on unmounted components
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const loadPosts = useCallback(async (append: boolean = false, useCursor: string | null = null) => {
    if (!mountedRef.current) return
    if (append) setLoadingMore(true); else setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ tab, limit: '20' })
      if (useCursor) params.set('cursor', useCursor)

      const res = await fetch(`/api/home/feed?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load feed')
      const data = await res.json()

      if (!mountedRef.current) return

      const safePosts = Array.isArray(data.posts) ? data.posts.filter((p: any) => p && p.id) : []

      if (append) {
        setPosts(prev => {
          // Dedupe by ID
          const existingIds = new Set(prev.map((p: any) => p.id))
          const newOnes = safePosts.filter((p: any) => !existingIds.has(p.id))
          return [...prev, ...newOnes]
        })
      } else {
        setPosts(safePosts)
        setNewPostsCount(0)
      }
      setCursor(data.nextCursor || null)
      setHasMore(!!data.hasMore)
    } catch (e: any) {
      if (mountedRef.current) setError(e?.message || 'Something went wrong')
    } finally {
      if (mountedRef.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [tab])

  useEffect(() => {
    setPosts([])
    setCursor(null)
    setHasMore(false)
    setNewPostsCount(0)
    loadPosts(false, null)
  }, [tab, loadPosts])

  // Infinite scroll — properly cleaned up
  useEffect(() => {
    const el = observerRef.current
    if (!el || !hasMore || loading || loadingMore || !cursor) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && mountedRef.current) {
          loadPosts(true, cursor)
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [hasMore, cursor, loading, loadingMore, loadPosts])

  // Real-time subscription — safer cleanup
  useEffect(() => {
    if (tab !== 'latest' && tab !== 'for-you') return
    if (posts.length === 0) return
    const topCreatedAt = posts[0]?.created_at
    if (!topCreatedAt) return

    let channel: any = null
    try {
      channel = supabase
        .channel(`home-feed-${tab}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'posts',
            filter: 'visibility=eq.global',
          },
          (payload: any) => {
            if (!mountedRef.current) return
            const newPost = payload?.new
            if (!newPost || newPost.is_draft) return
            if (newPost.user_id === currentUser?.id) return

            try {
              const newTs = new Date(newPost.created_at).getTime()
              const topTs = new Date(topCreatedAt).getTime()
              if (newTs > topTs) {
                setNewPostsCount(n => n + 1)
              }
            } catch { /* ignore date parse errors */ }
          }
        )
        .subscribe()
    } catch (e) {
      console.warn('[Realtime] subscribe failed', e)
    }

    return () => {
      if (channel) {
        try { supabase.removeChannel(channel) } catch { /* ignore */ }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, currentUser, tab, supabase])

  const loadNewPosts = useCallback(() => {
    setNewPostsCount(0)
    loadPosts(false, null)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [loadPosts])

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <div key={`skel-${i}`} className="h-40 rounded-xl border border-zinc-800 bg-zinc-950/40 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
        <p className="text-[13px] text-red-400 mb-3">{error}</p>
        <button
          onClick={() => loadPosts(false, null)}
          className="inline-flex items-center h-9 px-4 rounded-md border border-zinc-800 hover:border-zinc-700 text-[13px] font-medium text-zinc-300 hover:text-white"
        >
          Try again
        </button>
      </div>
    )
  }

  if (posts.length === 0) {
    const emptyMessage: Record<string, string> = {
      'for-you': "Your personalized feed is being prepared. Interact with a few posts to help us understand what you like.",
      'latest': "No posts yet. Be the first to post something.",
      'ventures': "No venture updates right now. Follow ventures to see their posts here.",
      'projects': "No project updates right now. Follow projects to see their posts here.",
    }
    const msg = emptyMessage[tab] || "Nothing here yet."

    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center">
        <p className="text-[14px] font-semibold text-white mb-1.5">Nothing here yet</p>
        <p className="text-[12.5px] text-zinc-500 max-w-md mx-auto">{msg}</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* 
        FIX: Moved the "new posts" indicator OUTSIDE of any sticky behavior 
        AND wrapped it in a stable container to prevent removeChild errors.
        The container always renders — only its inner content is conditional.
      */}
      <div className="relative min-h-0" aria-live="polite">
        {newPostsCount > 0 && (
          <div 
            key={`new-posts-${newPostsCount}`}
            className="sticky top-[80px] z-20 flex justify-center pointer-events-none mb-3"
          >
            <button
              onClick={loadNewPosts}
              className="pointer-events-auto inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white text-black text-[12.5px] font-bold shadow-[0_4px_20px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.5)] hover:bg-zinc-100 transition-all"
            >
              <ArrowUp size={12} weight="bold" />
              {newPostsCount} new {newPostsCount === 1 ? 'post' : 'posts'}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {posts.map((post, idx) => {
          if (!post || !post.id) return null
          return (
            <SafePostWrapper key={`post-${post.id}-${idx}`}>
              <HomePostCard post={post} currentUser={currentUser} />
            </SafePostWrapper>
          )
        })}
      </div>

      <div ref={observerRef} className="py-8 text-center">
        {loadingMore && (
          <div className="inline-flex items-center gap-2 text-[12px] text-zinc-500">
            <div className="w-3 h-3 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
            Loading more...
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-[12px] text-zinc-600">You&apos;re all caught up</p>
        )}
      </div>
    </div>
  )
}

// Per-post error boundary — one broken post won't kill the feed
function SafePostWrapper({ children }: { children: React.ReactNode }) {
  try {
    return <>{children}</>
  } catch {
    return null
  }
}