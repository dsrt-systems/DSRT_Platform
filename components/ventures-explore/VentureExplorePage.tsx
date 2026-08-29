'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { MagnifyingGlass, CircleNotch, Compass, X, FunnelSimple } from '@phosphor-icons/react'
import { FeaturedCarousel } from './FeaturedCarousel'
import { FilterSidebar } from './FilterSidebar'
import { VentureCard } from './VentureCard'
import { MobileFilterDrawer } from './MobileFilterDrawer'
import { SortDropdown } from './SortDropdown'
import { useExploreUrlState } from '@/hooks/useExploreUrlState'
import { useInfiniteFeed } from '@/hooks/useInfiniteFeed'
import { getAffinityLearner } from '@/lib/venture-explore/affinity-learner'

const DISCOVERY_TABS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'all', label: 'All Ventures' },
  { id: 'rising', label: 'Rising' },
  { id: 'new', label: 'New' },
]

export function VentureExplorePage() {
  const { filters, activeTab, setFilters, setActiveTab, clearFilters } = useExploreUrlState()
  const [banners, setBanners] = useState<any[]>([])
  const [searchInput, setSearchInput] = useState(filters.search || '')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  useEffect(() => {
    setSearchInput(filters.search || '')
  }, [filters.search])

  useEffect(() => {
    fetch('/api/ventures/explore/banners')
      .then(r => r.json())
      .then(d => setBanners(d.banners || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const flush = () => getAffinityLearner().flushImmediate()
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush()
    })
    return () => window.removeEventListener('beforeunload', flush)
  }, [])

  const fetcher = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams()

    // 🔑 INJECT SESSION ID for Session Intent Boost
    const sid = typeof window !== 'undefined' ? sessionStorage.getItem('dsrt_explore_session') : null
    if (sid) params.set('session_id', sid)

    if (filters.search) params.set('q', filters.search)
    if (filters.domains?.length) params.set('domain', filters.domains.join(','))
    if (filters.stages?.length) params.set('stage', filters.stages.join(','))
    if (filters.locations?.length) params.set('location', filters.locations.join(','))
    if (filters.venture_types?.length) params.set('type', filters.venture_types.join(','))
    if (filters.business_models?.length) params.set('model', filters.business_models.join(','))
    if (filters.team_sizes?.length) params.set('team', filters.team_sizes.join(','))
    if (filters.funding_stages?.length) params.set('funding', filters.funding_stages.join(','))
    if (filters.is_verified) params.set('verified', '1')
    if (filters.is_hiring) params.set('hiring', '1')
    if (filters.is_seeking_investment) params.set('investment', '1')
    if (filters.is_seeking_cofounder) params.set('cofounder', '1')
    if (filters.is_newly_launched) params.set('fresh', '1')
    if (filters.sort && filters.sort !== 'recommended') params.set('sort', filters.sort)
    params.set('vtab', activeTab)
    if (cursor) params.set('cursor', cursor)

    const res = await fetch(`/api/ventures/explore/feed?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to load feed')
    return await res.json()
  }, [filters, activeTab])

  const {
    modules,
    loading,
    loadingMore,
    hasMore,
    error,
    sentinelRef,
    removeItem
  } = useInfiniteFeed({
    fetcher,
    deps: [
      filters.search,
      filters.domains?.join(','),
      filters.stages?.join(','),
      filters.locations?.join(','),
      filters.venture_types?.join(','),
      filters.business_models?.join(','),
      filters.team_sizes?.join(','),
      filters.funding_stages?.join(','),
      filters.is_verified,
      filters.is_hiring,
      filters.is_seeking_investment,
      filters.is_seeking_cofounder,
      filters.is_newly_launched,
      filters.sort,
      activeTab,
    ]
  })

  const executeSearch = () => {
    setFilters({ ...filters, search: searchInput })
  }

  const clearSearch = () => {
    setSearchInput('')
    setFilters({ ...filters, search: '' })
  }

  const isFiltered = !!(
    filters.search ||
    filters.domains?.length ||
    filters.stages?.length ||
    filters.locations?.length ||
    filters.venture_types?.length ||
    filters.business_models?.length ||
    filters.team_sizes?.length ||
    filters.funding_stages?.length ||
    filters.is_verified ||
    filters.is_hiring ||
    filters.is_seeking_investment ||
    filters.is_seeking_cofounder ||
    filters.is_newly_launched
  )

  const activeFilterChips = useMemo(() => {
    const chips: { label: string; remove: () => void }[] = []

    ;(filters.domains || []).forEach(d => chips.push({
      label: d,
      remove: () => setFilters({ ...filters, domains: filters.domains?.filter(x => x !== d) })
    }))
    ;(filters.stages || []).forEach(s => chips.push({
      label: s,
      remove: () => setFilters({ ...filters, stages: filters.stages?.filter(x => x !== s) })
    }))
    ;(filters.locations || []).forEach(l => chips.push({
      label: l,
      remove: () => setFilters({ ...filters, locations: filters.locations?.filter(x => x !== l) })
    }))
    ;(filters.venture_types || []).forEach(t => chips.push({
      label: t,
      remove: () => setFilters({ ...filters, venture_types: filters.venture_types?.filter(x => x !== t) })
    }))
    ;(filters.business_models || []).forEach(m => chips.push({
      label: m,
      remove: () => setFilters({ ...filters, business_models: filters.business_models?.filter(x => x !== m) })
    }))
    ;(filters.team_sizes || []).forEach(t => chips.push({
      label: `Team: ${t}`,
      remove: () => setFilters({ ...filters, team_sizes: filters.team_sizes?.filter(x => x !== t) })
    }))
    ;(filters.funding_stages || []).forEach(f => chips.push({
      label: f,
      remove: () => setFilters({ ...filters, funding_stages: filters.funding_stages?.filter(x => x !== f) })
    }))

    if (filters.is_verified) chips.push({ label: 'Verified', remove: () => setFilters({ ...filters, is_verified: false }) })
    if (filters.is_hiring) chips.push({ label: 'Hiring', remove: () => setFilters({ ...filters, is_hiring: false }) })
    if (filters.is_seeking_investment) chips.push({ label: 'Seeking investment', remove: () => setFilters({ ...filters, is_seeking_investment: false }) })
    if (filters.is_seeking_cofounder) chips.push({ label: 'Seeking co-founder', remove: () => setFilters({ ...filters, is_seeking_cofounder: false }) })
    if (filters.is_newly_launched) chips.push({ label: 'Newly launched', remove: () => setFilters({ ...filters, is_newly_launched: false }) })

    return chips
  }, [filters, setFilters])

  return (
    <div className="space-y-8 font-sans pb-16 pt-2">

      <div>
        <h2 className="text-[22px] font-bold text-white tracking-tight">Explore ventures</h2>
        <p className="text-[13.5px] text-zinc-400 mt-1">
          Discover companies, products, builders and ideas across every industry.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
          placeholder="Search ventures, founders, industries, products..."
          className="w-full h-12 pl-11 pr-32 rounded-xl bg-[#121215] border border-white/[0.08] text-[13.5px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors shadow-sm"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {searchInput && (
            <button onClick={clearSearch} className="p-1 text-zinc-500 hover:text-white">
              <X size={14} weight="bold" />
            </button>
          )}
          <button
            onClick={executeSearch}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Discovery Tabs + Sort + Mobile Filter Button */}
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide flex-1">
          {DISCOVERY_TABS.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveTab(mode.id)}
              className={`text-[13.5px] font-semibold whitespace-nowrap transition-colors relative ${
                activeTab === mode.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {mode.label}
              {activeTab === mode.id && (
                <span className="absolute left-0 right-0 -bottom-3 h-0.5 bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SortDropdown
            value={filters.sort || 'recommended'}
            onChange={(v) => setFilters({ ...filters, sort: v as any })}
          />
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#121215] border border-white/[0.08] hover:border-white/[0.16] text-white text-[12px] font-semibold transition-all"
          >
            <FunnelSimple size={12} weight="bold" />
            Filters
            {activeFilterChips.length > 0 && (
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1 py-0.5">
                {activeFilterChips.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider">Active:</span>
          {activeFilterChips.map((chip, i) => (
            <button
              key={i}
              onClick={chip.remove}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-semibold text-zinc-200 hover:bg-white/[0.10] hover:border-white/20 transition-all"
            >
              {chip.label}
              <X size={10} weight="bold" />
            </button>
          ))}
          <button
            onClick={clearFilters}
            className="text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors underline underline-offset-2 ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Banner */}
      {activeTab === 'recommended' && !isFiltered && (
        <FeaturedCarousel banners={banners} />
      )}

      {/* Workspace */}
      <div className="flex flex-col lg:flex-row gap-8 items-start pt-2">
        <div className="hidden lg:block">
          <FilterSidebar
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={clearFilters}
          />
        </div>

        <div className="flex-1 w-full min-w-0 space-y-10">
          {loading ? (
            <SkeletonFeed />
          ) : error ? (
            <div className="p-12 border border-red-500/20 rounded-2xl bg-red-500/5 text-center space-y-3">
              <h3 className="text-[15px] font-bold text-white">Something went wrong</h3>
              <p className="text-[13px] text-zinc-500">{error}</p>
            </div>
          ) : modules.length === 0 || modules.every(m => m.items.length === 0) ? (
            <EmptyState onClear={clearFilters} />
          ) : (
            <>
              {modules.map((mod) => (
                mod.items.length > 0 && (
                  <div key={mod.id} className="space-y-4">
                    {(mod.title || mod.subtitle) && (
                      <div className="mb-2 flex items-end justify-between">
                        <div>
                          {mod.title && <h3 className="text-[16px] font-bold text-white tracking-tight">{mod.title}</h3>}
                          {mod.subtitle && <p className="text-[12.5px] text-zinc-500 mt-0.5">{mod.subtitle}</p>}
                        </div>
                        {mod.see_all_href && (
                          <a
                            href={mod.see_all_href}
                            className="text-[12px] font-semibold text-zinc-400 hover:text-white transition-colors"
                          >
                            See all →
                          </a>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {mod.items.map((venture, idx) => (
                        <VentureCard
                          key={venture.id}
                          venture={venture}
                          position={idx}
                          moduleType={mod.type}
                          onNotInterested={removeItem}
                        />
                      ))}
                    </div>
                  </div>
                )
              ))}

              {hasMore && (
                <div ref={sentinelRef} className="py-8 flex items-center justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-zinc-500">
                      <CircleNotch size={16} className="animate-spin" />
                      <span className="text-[11px] font-mono uppercase tracking-widest">Loading more ventures...</span>
                    </div>
                  )}
                </div>
              )}

              {!hasMore && modules.length > 0 && modules.some(m => m.items.length > 0) && (
                <div className="py-8 text-center text-[11px] text-zinc-600 font-mono uppercase tracking-widest">
                  End of discovery feed
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      <MobileFilterDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={clearFilters}
        activeCount={activeFilterChips.length}
      />
    </div>
  )
}

function SkeletonFeed() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="h-5 w-48 bg-white/[0.06] rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-[#121215] border border-white/[0.06] overflow-hidden">
              <div className="aspect-[16/9] bg-white/[0.03] animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-white/[0.06] rounded animate-pulse" />
                <div className="h-3 w-full bg-white/[0.04] rounded animate-pulse" />
                <div className="pt-3 border-t border-white/[0.04] flex justify-between">
                  <div className="h-3 w-20 bg-white/[0.04] rounded animate-pulse" />
                  <div className="h-3 w-12 bg-white/[0.04] rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="p-16 border border-white/[0.06] rounded-2xl bg-[#121215]/50 text-center space-y-4">
      <Compass size={32} className="text-zinc-600 mx-auto" />
      <div>
        <h3 className="text-[15px] font-bold text-white">No ventures match these filters</h3>
        <p className="text-[13px] text-zinc-500 max-w-sm mx-auto mt-1">
          Try broadening your search or removing a filter to see more results.
        </p>
      </div>
      <button
        onClick={onClear}
        className="mt-2 px-4 py-2 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white rounded-lg text-[12.5px] font-semibold transition-colors"
      >
        Clear all filters
      </button>
    </div>
  )
}