'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { OpportunityCard } from './OpportunityCard'
import type { FilterState } from './FiltersPanel'
import type { TabId } from './LookingForTabs'

interface Props {
  query: string
  filters: FilterState
  sort: string
  tab: TabId
  onCountChange?: (count: number, isLoading: boolean) => void
}

export function OpportunityFeed({ query, filters, sort, tab, onCountChange }: Props) {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const observerRef = useRef<HTMLDivElement>(null)

  // Notify parent about count + loading state
  useEffect(() => {
    if (onCountChange) onCountChange(total, loading)
  }, [total, loading, onCountChange])

  const buildQueryString = useCallback((currentOffset: number) => {
    const params = new URLSearchParams()
    params.set('limit', '24')
    params.set('offset', currentOffset.toString())
    params.set('sort', sort)
    if (query) params.set('q', query)
    if (filters.category) params.set('category', filters.category)
    if (filters.subcategory) params.set('subcategory', filters.subcategory)
    if (filters.type) params.set('type', filters.type)
    if (filters.experience) params.set('experience', filters.experience)
    if (filters.compensation) params.set('compensation', filters.compensation)
    if (filters.work_mode) params.set('work_mode', filters.work_mode)
    if (filters.location) params.set('location', filters.location)
    if (filters.time_commitment) params.set('time_commitment', filters.time_commitment)
    if (filters.project_length) params.set('project_length', filters.project_length)
    if (filters.post_age) params.set('post_age', filters.post_age)
    if (filters.skills.length > 0) params.set('skills', filters.skills.join(','))
    if (filters.min_budget) params.set('min_budget', filters.min_budget.toString())
    if (filters.max_budget) params.set('max_budget', filters.max_budget.toString())
    return params.toString()
  }, [query, filters, sort])

  const load = useCallback(async (append: boolean = false) => {
    if (append) setLoadingMore(true); else setLoading(true)
    setError(null)
    try {
      const currentOffset = append ? offset : 0
      const qs = buildQueryString(currentOffset)
      const res = await fetch('/api/opportunities?' + qs)
      if (!res.ok) throw new Error('Failed to load opportunities')
      const data = await res.json()

      if (append) {
        setItems(prev => [...prev, ...(data.opportunities || [])])
      } else {
        setItems(data.opportunities || [])
      }
      setTotal(data.total || 0)
      setHasMore(data.hasMore || false)
      setOffset(currentOffset + (data.opportunities?.length || 0))
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildQueryString])

  useEffect(() => {
    load(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters, sort])

  useEffect(() => {
    const el = observerRef.current
    if (!el || !hasMore || loading || loadingMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
          load(true)
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, load])

  const handleSave = async (id: string, currentlySaved: boolean) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_saved: !currentlySaved } : i))
    try {
      if (currentlySaved) {
        await fetch(`/api/opportunities/${id}/save`, { method: 'DELETE' })
      } else {
        await fetch(`/api/opportunities/${id}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
      }
    } catch {
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_saved: currentlySaved } : i))
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-40 rounded-xl border border-zinc-800 bg-zinc-950/40 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
        <p className="text-[13px] text-red-400">{error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center">
        <p className="text-[14px] font-bold text-white mb-1">No opportunities match your filters</p>
        <p className="text-[12.5px] text-zinc-500">Try clearing some filters or broadening your search.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {items.map(item => (
          <OpportunityCard
            key={item.id}
            opportunity={item}
            onSave={handleSave}
          />
        ))}
      </div>
      <div ref={observerRef} className="py-8 text-center">
        {loadingMore && (
          <div className="inline-flex items-center gap-2 text-[12px] text-zinc-500">
            <div className="w-3 h-3 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
            Loading more...
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <p className="text-[12px] text-zinc-600">You've reached the end</p>
        )}
      </div>
    </>
  )
}