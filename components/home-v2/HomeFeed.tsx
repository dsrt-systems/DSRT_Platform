'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowUp } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { HomePostCard } from './HomePostCard'
import type { HomeTab } from './HomeTabs'

interface Props {
  tab: HomeTab
  currentUser: any
}

export function HomeFeed({ tab, currentUser }: Props) {
  const supabase = createClient()

  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newPostsCount, setNewPostsCount] = useState(0)
  const observerRef = useRef<HTMLDivElement>(null)

  const loadPosts = useCallback(async (append: boolean = false, useCursor: string | null = null) => {
    if (append) setLoadingMore(true); else setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ tab, limit: '20' })
      if (useCursor) params.set('cursor', useCursor)

      const res = await fetch(`/api/home/feed?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load feed')
      const data = await res.json()

      if (append) {
        setPosts(prev => [...prev, ...(data.posts || [])])
      } else {
        setPosts(data.posts || [])
        setNewPostsCount(0)
      }
      setCursor(data.nextCursor)
      setHasMore(data.hasMore || false)
    } catch (e: any) {
      setError(e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [tab])

  useEffect(() => {
    setPosts([])
    setCursor(null)
    setHasMore(false)
    setNewPostsCount(0)
    loadPosts(false, null)
  }, [tab, loadPosts])

  // Infinite scroll
  useEffect(() => {
    const el = observerRef.current
    if (!el || !hasMore || loading || loadingMore || !cursor) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) loadPosts(true, cursor)
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, cursor, loading, loadingMore, loadPosts])

  // Real-time: count NEW posts arriving above current top
  useEffect(() => {
    if (posts.length === 0) return
    const topCreatedAt = posts[0]?.created_at
    if (!topCreatedAt) return

    const channel = supabase
      .channel('home-feed-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: 'visibility=eq.global',
        },
        (payload: any) => {
          const newPost = payload.new
          if (!newPost) return
          if (newPost.is_draft) return
          if (newPost.user_id === currentUser?.id) return // don't count our own

          const newTs = new Date(newPost.created_at).getTime()
          const topTs = new Date(topCreatedAt).getTime()
          if (newTs > topTs) {
            setNewPostsCount(n => n + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, currentUser])

  const loadNewPosts = () => {
    setNewPostsCount(0)
    loadPosts(false, null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-40 rounded-xl border border-zinc-800 bg-zinc-950/40 animate-pulse" />
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
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center">
        <p className="text-[14px] font-semibold text-white mb-1.5">Nothing here yet</p>
        <p className="text-[12.5px] text-zinc-500 max-w-md mx-auto">
          {tab === 'following'
            ? "Follow people and ventures to see their posts here."
            : tab === 'ventures'
            ? "No venture posts to show right now."
            : "Be the first to post something."}
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Floating "N new posts" bar */}
      {newPostsCount > 0 && (
        <div className="sticky top-[80px] z-20 flex justify-center pointer-events-none">
          <button
            onClick={loadNewPosts}
            className={
              'pointer-events-auto inline-flex items-center gap-1.5 h-9 px-4 rounded-full ' +
              'bg-white text-black text-[12.5px] font-bold ' +
              'shadow-[0_4px_20px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.5)] ' +
              'hover:bg-zinc-100 transition-all animate-in fade-in slide-in-from-top-2 duration-200'
            }
          >
            <ArrowUp size={12} weight="bold" />
            {newPostsCount} new {newPostsCount === 1 ? 'post' : 'posts'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {posts.map(post => (
          <HomePostCard key={post.id} post={post} currentUser={currentUser} />
        ))}
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
    </>
  )
}