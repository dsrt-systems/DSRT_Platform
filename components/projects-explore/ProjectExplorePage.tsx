'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  MagnifyingGlass, CircleNotch, Compass, X, FunnelSimple
} from '@phosphor-icons/react'

import { ProjectFeaturedCarousel } from './ProjectFeaturedCarousel'
import { ProjectFilterSidebar } from './ProjectFilterSidebar'
import { ProjectCard } from './ProjectCard'
import { ProjectMobileFilterDrawer } from './ProjectMobileFilterDrawer'
import { ProjectSortDropdown } from './ProjectSortDropdown'

import { useProjectExploreUrlState } from '@/hooks/useProjectExploreUrlState'
import { useProjectInfiniteFeed } from '@/hooks/useProjectInfiniteFeed'
import { getProjectAffinityLearner } from '@/lib/project-explore/affinity-learner'

const DISCOVERY_TABS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'all', label: 'All Projects' },
  { id: 'rising', label: 'Rising' },
  { id: 'new', label: 'New' },
]

export function ProjectExplorePage() {
  const { filters, activeTab, setFilters, setActiveTab, clearFilters } = useProjectExploreUrlState()

  const [banners, setBanners] = useState<any[]>([])
  const [searchInput, setSearchInput] = useState(filters.search || '')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Keep search input in sync with URL
  useEffect(() => {
    setSearchInput(filters.search || '')
  }, [filters.search])

  // Load banners
  useEffect(() => {
    fetch('/api/projects/explore/banners')
      .then(r => r.json())
      .then(d => setBanners(d.banners || []))
      .catch(() => {})
  }, [])

  // Flush affinity events on unload
  useEffect(() => {
    const flush = () => getProjectAffinityLearner().flushImmediate()
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush()
    })
    return () => window.removeEventListener('beforeunload', flush)
  }, [])

  // ─── Feed fetcher ───
  const fetcher = useCallback(
    async (cursor?: string) => {
      const params = new URLSearchParams()

      const sid = getProjectAffinityLearner().getSessionId()
      if (sid) params.set('session_id', sid)

      if (filters.search) params.set('q', filters.search)
      if (filters.domains?.length) params.set('domain', filters.domains.join(','))
      if (filters.technologies?.length) params.set('tech', filters.technologies.join(','))
      if (filters.stages?.length) params.set('stage', filters.stages.join(','))
      if (filters.project_types?.length) params.set('ptype', filters.project_types.join(','))
      if (filters.locations?.length) params.set('location', filters.locations.join(','))
      if (filters.licenses?.length) params.set('license', filters.licenses.join(','))
      if (filters.is_open_source) params.set('oss', '1')
      if (filters.is_hiring) params.set('hiring', '1')
      if (filters.is_looking_for_collaborators) params.set('collab', '1')
      if (filters.is_verified) params.set('verified', '1')
      if (filters.is_newly_launched) params.set('fresh', '1')
      if (filters.has_repository) params.set('repo', '1')
      if (filters.sort && filters.sort !== 'recommended') params.set('sort', filters.sort)
      params.set('ptab', activeTab)
      if (cursor) params.set('cursor', cursor)

      const res = await fetch(`/api/projects/explore/feed?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load project feed')
      return await res.json()
    },
    [filters, activeTab]
  )

  const { modules, loading, loadingMore, hasMore, error, sentinelRef, removeItem } =
    useProjectInfiniteFeed({
      fetcher,
      deps: [
        filters.search,
        filters.domains?.join(','),
        filters.technologies?.join(','),
        filters.stages?.join(','),
        filters.project_types?.join(','),
        filters.locations?.join(','),
        filters.licenses?.join(','),
        filters.is_open_source,
        filters.is_hiring,
        filters.is_looking_for_collaborators,
        filters.is_verified,
        filters.is_newly_launched,
        filters.has_repository,
        filters.sort,
        activeTab,
      ],
    })

  const executeSearch = () => setFilters({ ...filters, search: searchInput })
  const clearSearch = () => {
    setSearchInput('')
    setFilters({ ...filters, search: '' })
  }

  const isFiltered = !!(
    filters.search ||
    filters.domains?.length ||
    filters.technologies?.length ||
    filters.stages?.length ||
    filters.project_types?.length ||
    filters.locations?.length ||
    filters.licenses?.length ||
    filters.is_open_source ||
    filters.is_hiring ||
    filters.is_looking_for_collaborators ||
    filters.is_verified ||
    filters.is_newly_launched ||
    filters.has_repository
  )

  // ─── Active filter chips ───
  const activeFilterChips = useMemo(() => {
    const chips: { label: string; remove: () => void }[] = []

    ;(filters.domains || []).forEach(d =>
      chips.push({
        label: d,
        remove: () =>
          setFilters({ ...filters, domains: filters.domains?.filter(x => x !== d) }),
      })
    )
    ;(filters.technologies || []).forEach(t =>
      chips.push({
        label: t,
        remove: () =>
          setFilters({ ...filters, technologies: filters.technologies?.filter(x => x !== t) }),
      })
    )
    ;(filters.stages || []).forEach(s =>
      chips.push({
        label: `Stage: ${s}`,
        remove: () =>
          setFilters({ ...filters, stages: filters.stages?.filter(x => x !== s) }),
      })
    )
    ;(filters.project_types || []).forEach(t =>
      chips.push({
        label: `Type: ${t}`,
        remove: () =>
          setFilters({ ...filters, project_types: filters.project_types?.filter(x => x !== t) }),
      })
    )
    ;(filters.licenses || []).forEach(l =>
      chips.push({
        label: `License: ${l}`,
        remove: () =>
          setFilters({ ...filters, licenses: filters.licenses?.filter(x => x !== l) }),
      })
    )
    ;(filters.locations || []).forEach(loc =>
      chips.push({
        label: loc,
        remove: () =>
          setFilters({ ...filters, locations: filters.locations?.filter(x => x !== loc) }),
      })
    )

    if (filters.is_open_source)
      chips.push({
        label: 'Open source',
        remove: () => setFilters({ ...filters, is_open_source: false }),
      })
    if (filters.is_looking_for_collaborators)
      chips.push({
        label: 'Looking for collaborators',
        remove: () => setFilters({ ...filters, is_looking_for_collaborators: false }),
      })
    if (filters.is_hiring)
      chips.push({
        label: 'Hiring',
        remove: () => setFilters({ ...filters, is_hiring: false }),
      })
    if (filters.is_verified)
      chips.push({
        label: 'Verified',
        remove: () => setFilters({ ...filters, is_verified: false }),
      })
    if (filters.is_newly_launched)
      chips.push({
        label: 'Newly launched',
        remove: () => setFilters({ ...filters, is_newly_launched: false }),
      })
    if (filters.has_repository)
      chips.push({
        label: 'Has repository',
        remove: () => setFilters({ ...filters, has_repository: false }),
      })

    return chips
  }, [filters, setFilters])

  const primaryModule = modules[0]

  return (
    <div className="font-sans">
      {/* Top Header — non-scrolling */}
      <div className="space-y-6 pb-6">
        <div>
          <h2 className="text-[22px] font-bold text-white tracking-tight">Explore projects</h2>
          <p className="text-[13.5px] text-zinc-400 mt-1">
            Discover experiments, research, hardware, and open source built across every domain.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && executeSearch()}
            placeholder="Search projects, PyTorch, robotics, open source, research..."
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

        {/* Active filter chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider">
              Active:
            </span>
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

        {/* Banner (only on Recommended tab + no filters) */}
        {activeTab === 'recommended' && !isFiltered && (
          <ProjectFeaturedCarousel banners={banners} />
        )}
      </div>

      {/* Workspace: Sticky Filter Sidebar + Scrolling Feed */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* STICKY SIDEBAR (desktop only) */}
        <aside className="hidden lg:block w-[260px] shrink-0 sticky top-6 max-h-[calc(100vh-4rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <ProjectFilterSidebar
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={clearFilters}
          />
        </aside>

        {/* FEED */}
        <div className="flex-1 w-full min-w-0 space-y-6">
          {/* Section header + tabs + sort + mobile filter */}
          <div className="flex items-end justify-between gap-4 flex-wrap border-b border-white/[0.08] pb-4">
            <div>
              <h3 className="text-[18px] font-bold text-white tracking-tight">
                {primaryModule?.title || 'Recommended for you'}
              </h3>
              {primaryModule?.subtitle && (
                <p className="text-[12.5px] text-zinc-500 mt-0.5">{primaryModule.subtitle}</p>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Discovery tabs */}
              <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
                {DISCOVERY_TABS.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setActiveTab(mode.id)}
                    className={`text-[12.5px] font-semibold whitespace-nowrap transition-colors ${
                      activeTab === mode.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="w-px h-4 bg-white/10" />

              <ProjectSortDropdown
                value={filters.sort || 'recommended'}
                onChange={v => setFilters({ ...filters, sort: v as any })}
              />

              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#121215] border border-white/[0.08] hover:border-white/[0.16] text-white text-[12px] font-semibold transition-all"
              >
                <FunnelSimple size={12} weight="bold" />
                Filters
                {activeFilterChips.length > 0 && (
                  <span className="text-[9px] font-mono text-white bg-white/[0.08] border border-white/15 rounded px-1 py-0.5">
                    {activeFilterChips.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* State machine */}
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
              {/* Continuous grid (merges all page items) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {modules.flatMap(m => m.items).map((project, idx) => (
                  <ProjectCard
                    key={`${project.id}-${idx}`}
                    project={project}
                    position={idx}
                    moduleType={modules[0]?.type}
                    onNotInterested={removeItem}
                  />
                ))}
              </div>

              {/* Infinite scroll sentinel */}
              <div
                ref={sentinelRef}
                className="py-8 flex items-center justify-center min-h-[80px]"
              >
                {loadingMore && (
                  <div className="flex items-center gap-2 text-zinc-500">
                    <CircleNotch size={16} className="animate-spin" />
                    <span className="text-[11px] font-mono uppercase tracking-widest">
                      Discovering more projects...
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      <ProjectMobileFilterDrawer
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
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-[#121215] border border-white/[0.06] overflow-hidden"
        >
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
  )
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="p-16 border border-white/[0.06] rounded-2xl bg-[#121215]/50 text-center space-y-4">
      <Compass size={32} className="text-zinc-600 mx-auto" />
      <div>
        <h3 className="text-[15px] font-bold text-white">No projects match these filters</h3>
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