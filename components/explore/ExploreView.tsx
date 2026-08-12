'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  MagnifyingGlass, Command, Funnel, CaretDown, BookmarkSimple,
  Users, Heart, Lightning, ArrowRight, Trophy, CheckCircle,
  Sparkle, DotsThree, X, Compass
} from '@phosphor-icons/react'
import { ExploreCarousel } from './ExploreCarousel'

interface ExploreProject {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  icon: string
  color: string
  stage: string
  cover_image_url: string | null
  project_number: string
  category: string[]
  tech_stack: string[]
  sector: string | null
  team_size: number
  open_roles: number
  follower_count: number
  view_count: number
  save_count: number
  traction_score: number
  global_rank: number | null
  is_dsrt_verified: boolean
  is_open_source: boolean
  founder_verified: boolean
  founder_id: string | null
  founder_name: string | null
  founder_username: string | null
  founder_avatar: string | null
  founder_user_verified: boolean
  personal_score?: number
}

interface DashboardData {
  topIndustries: string[]
  allSectors: { id: string; name: string; slug: string; category: string; popular: boolean }[]
  banners: any[]
  recommendations: ExploreProject[]
  hasMore: boolean
}

const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'newest', label: 'Newest' },
  { id: 'most_viewed', label: 'Most Viewed' },
  { id: 'trending', label: 'Trending' },
  { id: 'oldest', label: 'Oldest' },
] as const

const STAGE_COLORS: Record<string, string> = {
  idea: 'bg-purple-500/80', planning: 'bg-blue-500/80', building: 'bg-cyan-500/80',
  prototype: 'bg-orange-500/80', alpha: 'bg-emerald-500/80', beta: 'bg-yellow-500/80',
  mvp: 'bg-green-500/80', launched: 'bg-red-500/80', scaling: 'bg-pink-500/80',
}

const STAGE_LABELS: Record<string, string> = {
  idea: 'IDEA', planning: 'PLANNING', building: 'BUILDING', prototype: 'PROTOTYPE',
  alpha: 'ALPHA', beta: 'BETA', mvp: 'MVP', launched: 'LAUNCHED', scaling: 'SCALING',
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

export function ExploreView() {
  const router = useRouter()
  const supabase = createClient()
  const observerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [industry, setIndustry] = useState<string>('all')
  const [sort, setSort] = useState<string>('recommended')
  const [sortOpen, setSortOpen] = useState(false)
  const [industryMoreOpen, setIndustryMoreOpen] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [items, setItems] = useState<ExploreProject[]>([])

  // Fetch initial dashboard
  const fetchDashboard = useCallback(async (industryFilter: string, sortBy: string) => {
    try {
      setLoading(true)
      const url = '/api/explore/dashboard?industry=' + encodeURIComponent(industryFilter) + '&sort=' + sortBy
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch')
      const json: DashboardData = await res.json()
      setData(json)
      setItems(json.recommendations || [])
      setOffset((json.recommendations || []).length)
      setHasMore(json.hasMore)
    } catch (err) {
      console.error('Explore fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard(industry, sort)
  }, [industry, sort, fetchDashboard])

  // Load saved-state for visible items
  useEffect(() => {
    if (items.length === 0) return
    const ids = items.map(i => i.id).join(',')
    fetch('/api/explore/save?ids=' + ids)
      .then(r => r.json())
      .then(d => setSavedIds(new Set(d.saved || [])))
      .catch(() => {})
  }, [items])

  // Infinite scroll: intersection observer
  useEffect(() => {
    const el = observerRef.current
    if (!el || !hasMore || loading || loadingMore) return

    const observer = new IntersectionObserver(async (entries) => {
      if (entries[0]?.isIntersecting && !loadingMore && hasMore) {
        setLoadingMore(true)
        try {
          const url = '/api/explore/recommendations?industry=' + encodeURIComponent(industry) +
            '&sort=' + sort + '&limit=24&offset=' + offset
          const res = await fetch(url)
          const json = await res.json()
          const newItems: ExploreProject[] = json.results || []
          setItems(prev => [...prev, ...newItems])
          setOffset(prev => prev + newItems.length)
          setHasMore(newItems.length >= 24)
        } catch (err) {
          console.error('Load more error:', err)
        } finally {
          setLoadingMore(false)
        }
      }
    }, { rootMargin: '400px' })

    observer.observe(el)
    return () => observer.disconnect()
  }, [industry, sort, offset, hasMore, loading, loadingMore])

  // Search typeahead
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); setSearchOpen(false); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/projects/search?q=' + encodeURIComponent(searchQuery))
        const json = await res.json()
        setSearchResults(json.results || [])
        setSearchOpen(true)
      } catch { setSearchResults([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('explore-search')?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const toggleSave = async (projectId: string) => {
    // Optimistic update
    const wasSaved = savedIds.has(projectId)
    const newSet = new Set(savedIds)
    if (wasSaved) newSet.delete(projectId)
    else newSet.add(projectId)
    setSavedIds(newSet)

    try {
      const res = await fetch('/api/explore/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      })
      if (!res.ok) throw new Error('Save failed')
    } catch (err) {
      // Rollback
      const rollback = new Set(savedIds)
      setSavedIds(rollback)
      console.error('Save toggle error:', err)
    }
  }

  const topIndustries = data?.topIndustries || []
  const allSectors = data?.allSectors || []
  const banners = data?.banners || []

  // Split visible vs more
  const visibleIndustries = topIndustries.slice(0, 10)
  const hiddenIndustries = allSectors
    .map(s => s.name)
    .filter(n => !visibleIndustries.includes(n) && n !== 'all')

  return (
    <div className="w-full">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-5 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Compass size={22} weight="fill" className="text-purple-400" />
            Explore Projects
          </h1>
          <p className="text-xs md:text-sm text-zinc-500 mt-1 max-w-lg">
            Discover startups, research, open source initiatives and real-world products from builders across DSRT Connect.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-[420px]">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <Input
              id="explore-search"
              placeholder="Search projects, technologies, founders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              className="pl-9 pr-14 h-10 bg-white/[0.04] border-white/[0.08] text-white text-sm placeholder:text-zinc-600 rounded-lg focus:ring-purple-500/30 focus:border-purple-500/30"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-0.5 text-zinc-600">
              <Command size={12} /><span className="text-[10px] font-mono">K</span>
            </div>

            {searchOpen && searchResults.length > 0 && (
              <div className="absolute z-50 top-12 left-0 right-0 bg-[#12121a] border border-white/[0.08] rounded-lg shadow-2xl max-h-[380px] overflow-y-auto">
                {searchResults.map((r: any) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] cursor-pointer border-b border-white/[0.04] last:border-0"
                    onClick={() => { router.push('/projects/' + r.slug); setSearchOpen(false); setSearchQuery('') }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                      {r.cover_image_url ? (
                        <img src={r.cover_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{r.icon || '\u26A1'}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white font-medium truncate">{r.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">
                        {r.project_number} · {r.tagline || r.description || 'No description'}
                      </p>
                    </div>
                    {r.founder_avatar && (
                      <img src={r.founder_avatar} className="w-5 h-5 rounded-full flex-shrink-0" alt="" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterDrawerOpen(true)}
            className="h-10 border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.06] text-xs"
          >
            <Funnel size={14} className="mr-1.5" /> Filters
          </Button>
        </div>
      </div>

      {/* Industry filter pills */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Browse by Industry
          </h3>
          {topIndustries.length > 0 && (
            <span className="text-[10px] text-zinc-600">Personalized for you</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIndustry('all')}
            className={
              'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ' +
              (industry === 'all'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:bg-white/[0.08] hover:text-white')
            }
          >
            All
          </button>
          {visibleIndustries.map(ind => (
            <button
              key={ind}
              onClick={() => setIndustry(ind)}
              className={
                'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ' +
                (industry === ind
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:bg-white/[0.08] hover:text-white')
              }
            >
              {ind}
            </button>
          ))}
          {hiddenIndustries.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIndustryMoreOpen(!industryMoreOpen)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:bg-white/[0.08] hover:text-white transition-all flex items-center gap-1"
              >
                More <CaretDown size={11} />
              </button>
              {industryMoreOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIndustryMoreOpen(false)} />
                  <div className="absolute z-40 top-10 left-0 w-[280px] max-h-[400px] overflow-y-auto bg-[#12121a] border border-white/[0.08] rounded-lg shadow-2xl p-2">
                    {hiddenIndustries.map(ind => (
                      <button
                        key={ind}
                        onClick={() => { setIndustry(ind); setIndustryMoreOpen(false) }}
                        className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.05] rounded-md"
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Featured Carousel */}
      <div className="mb-6">
        {loading ? (
          <Skeleton className="w-full h-[280px] md:h-[340px] rounded-2xl bg-white/[0.03]" />
        ) : (
          <ExploreCarousel banners={banners} />
        )}
      </div>

      {/* Recommendations header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Sparkle size={16} weight="fill" className="text-purple-400" />
          Recommended For You
        </h2>
        <div className="relative">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 transition-colors"
          >
            Sort by: <span className="text-white font-medium">
              {SORT_OPTIONS.find(s => s.id === sort)?.label}
            </span>
            <CaretDown size={11} />
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
              <div className="absolute z-40 top-10 right-0 w-[180px] bg-[#12121a] border border-white/[0.08] rounded-lg shadow-2xl py-1">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setSort(opt.id); setSortOpen(false) }}
                    className={
                      'w-full text-left px-3 py-2 text-xs hover:bg-white/[0.05] ' +
                      (sort === opt.id ? 'text-purple-400 font-medium' : 'text-zinc-300')
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[380px] rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">
          <Compass size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No projects match this filter yet.</p>
          <p className="text-xs mt-1 text-zinc-700">Try selecting a different industry or "All".</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(p => (
              <ExploreProjectCard
                key={p.id}
                project={p}
                saved={savedIds.has(p.id)}
                onToggleSave={() => toggleSave(p.id)}
                onOpen={() => router.push('/projects/' + p.slug)}
              />
            ))}
          </div>

          {/* Load more sentinel */}
          <div ref={observerRef} className="h-20 flex items-center justify-center mt-4">
            {loadingMore && (
              <div className="text-zinc-500 text-xs flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                Loading more...
              </div>
            )}
            {!hasMore && items.length > 0 && (
              <p className="text-zinc-700 text-xs">You've reached the end</p>
            )}
          </div>
        </>
      )}

      {/* Filter drawer */}
      {filterDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setFilterDrawerOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[380px] bg-[#0f0f18] border-l border-white/[0.08] shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-[#0f0f18] border-b border-white/[0.06] px-5 py-4 flex items-center justify-between z-10">
              <h3 className="text-base font-semibold text-white">Filters</h3>
              <button onClick={() => setFilterDrawerOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
                  Sort By
                </label>
                <div className="space-y-1">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSort(opt.id)}
                      className={
                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ' +
                        (sort === opt.id
                          ? 'bg-purple-500/15 border border-purple-500/30 text-purple-300'
                          : 'text-zinc-300 hover:bg-white/[0.04] border border-transparent')
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
                  Industry
                </label>
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  <button
                    onClick={() => setIndustry('all')}
                    className={
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ' +
                      (industry === 'all'
                        ? 'bg-purple-500/15 border border-purple-500/30 text-purple-300'
                        : 'text-zinc-300 hover:bg-white/[0.04] border border-transparent')
                    }
                  >
                    All Industries
                  </button>
                  {allSectors.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setIndustry(s.name)}
                      className={
                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ' +
                        (industry === s.name
                          ? 'bg-purple-500/15 border border-purple-500/30 text-purple-300'
                          : 'text-zinc-300 hover:bg-white/[0.04] border border-transparent')
                      }
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-[#0f0f18] border-t border-white/[0.06] p-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => { setIndustry('all'); setSort('recommended') }}
                className="flex-1 border-white/[0.08] text-zinc-300 h-9 text-xs"
              >
                Reset
              </Button>
              <Button
                onClick={() => setFilterDrawerOpen(false)}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white h-9 text-xs"
              >
                Apply
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Individual project card
// ═══════════════════════════════════════════
function ExploreProjectCard({
  project, saved, onToggleSave, onOpen
}: {
  project: ExploreProject
  saved: boolean
  onToggleSave: () => void
  onOpen: () => void
}) {
  const stage = project.stage || 'building'
  const stageColor = STAGE_COLORS[stage] || 'bg-gray-500/80'
  const stageLabel = STAGE_LABELS[stage] || stage.toUpperCase()

  return (
    <div className="group relative bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-purple-500/30 transition-all cursor-pointer flex flex-col" onClick={onOpen}>
      {/* Cover */}
      <div className="relative h-[160px] overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/10">
        {project.cover_image_url ? (
          <img
            src={project.cover_image_url}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-60">{project.icon || '\u26A1'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Stage badge */}
        <div className="absolute top-3 left-3">
          <span className={'px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider ' + stageColor}>
            {stageLabel}
          </span>
        </div>

        {/* Save button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave() }}
          className={
            'absolute top-3 right-3 w-8 h-8 rounded-lg backdrop-blur-md border flex items-center justify-center transition-all ' +
            (saved
              ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300'
              : 'bg-black/50 border-white/10 text-white hover:bg-white/20')
          }
          aria-label={saved ? 'Unsave' : 'Save'}
        >
          <BookmarkSimple size={14} weight={saved ? 'fill' : 'regular'} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-base font-semibold text-white mb-1 line-clamp-1">{project.name}</h3>
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-2">
          {project.tagline || project.description || 'No description available'}
        </p>
        <p className="text-[10px] text-zinc-600 font-mono mb-3">{project.project_number}</p>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {project.founder_verified && (
            <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/25 px-1.5 py-0.5 rounded text-[9px] font-semibold text-blue-300">
              <CheckCircle size={9} weight="fill" /> Verified Founder
            </span>
          )}
          {project.is_dsrt_verified && (
            <span className="inline-flex items-center gap-1 bg-purple-500/10 border border-purple-500/25 px-1.5 py-0.5 rounded text-[9px] font-semibold text-purple-300">
              <CheckCircle size={9} weight="fill" /> DSRT Verified
            </span>
          )}
          {project.is_open_source && (
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded text-[9px] font-semibold text-emerald-300">
              <CheckCircle size={9} weight="fill" /> Open Source
            </span>
          )}
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-3 text-[11px] text-zinc-500 mb-3 pb-3 border-b border-white/[0.05]">
          <span className="flex items-center gap-1">
            <Users size={11} /> {formatNumber(project.team_size || 1)} Builder{(project.team_size || 1) !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <Heart size={11} /> {formatNumber(project.follower_count || 0)} Follower{(project.follower_count || 0) !== 1 ? 's' : ''}
          </span>
          {project.open_roles > 0 && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Lightning size={11} /> {project.open_roles} Open
            </span>
          )}
        </div>

        {/* Bottom row: global rank + View */}
        <div className="mt-auto flex items-center justify-between">
          {project.global_rank ? (
            <span className="flex items-center gap-1.5 text-xs">
              <Trophy size={12} weight="fill" className="text-yellow-400" />
              <span className="text-white font-bold">#{project.global_rank}</span>
              <span className="text-zinc-500 text-[10px]">Global Rank</span>
            </span>
          ) : (
            <span />
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onOpen() }}
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-medium"
          >
            View Project <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
