'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ExploreFeedModule } from '@/lib/venture-explore/types'

interface UseInfiniteFeedOptions {
  fetcher: (cursor?: string) => Promise<{ modules: ExploreFeedModule[], nextCursor?: string | null }>
  deps: any[]
  enabled?: boolean
}

/**
 * Manages cursor-based feed pagination with IntersectionObserver auto-load.
 */
export function useInfiniteFeed({ fetcher, deps, enabled = true }: UseInfiniteFeedOptions) {
  const [modules, setModules] = useState<ExploreFeedModule[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const lastFetchRef = useRef<string>('')

  // Initial + filter-change load
  useEffect(() => {
    if (!enabled) return
    
    const fetchKey = JSON.stringify(deps)
    if (fetchKey === lastFetchRef.current) return
    lastFetchRef.current = fetchKey

    let cancelled = false
    setLoading(true)
    setError(null)
    setModules([])
    setCursor(null)
    setHasMore(true)

    fetcher()
      .then(({ modules: mods, nextCursor }) => {
        if (cancelled) return
        setModules(mods || [])
        setCursor(nextCursor || null)
        setHasMore(!!nextCursor)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e?.message || 'Failed to load feed')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps.concat([enabled]))

  // Load more from cursor
  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const { modules: newMods, nextCursor } = await fetcher(cursor)
      if (newMods && newMods.length > 0) {
        // Merge into existing modules (append to catalog module, or add as new)
        setModules(prev => {
          const merged = [...prev]
          for (const m of newMods) {
            const existing = merged.find(x => x.id === m.id)
            if (existing) {
              // Dedupe by id and append
              const existingIds = new Set(existing.items.map(i => i.id))
              existing.items = [...existing.items, ...m.items.filter(i => !existingIds.has(i.id))]
            } else {
              merged.push(m)
            }
          }
          return merged
        })
      }
      setCursor(nextCursor || null)
      setHasMore(!!nextCursor)
    } catch (e: any) {
      console.error('Load more failed:', e)
    } finally {
      setLoadingMore(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, loadingMore, hasMore, fetcher])

  // IntersectionObserver — auto-load when sentinel enters viewport
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '400px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [loadMore, hasMore, loading])

  const removeItem = useCallback((ventureId: string) => {
    setModules(prev => prev.map(m => ({
      ...m,
      items: m.items.filter(i => i.id !== ventureId)
    })))
  }, [])

  return { modules, loading, loadingMore, hasMore, error, sentinelRef, loadMore, removeItem }
}