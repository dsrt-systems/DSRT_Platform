'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  MagnifyingGlass, Plus, Command, ArrowRight, Buildings, Compass,
  Heart, BookmarkSimple, Handshake, Briefcase, Sparkle, CaretDown,
  Rocket, Robot, Crown, ArrowUpRight, ArrowsClockwise, DotsThreeOutline, X
} from '@phosphor-icons/react'
import { VentureCard } from './VentureCard'
import { VentureCategoryPills } from './VentureCategoryPills'
import { VentureFeaturedCarousel } from './VentureFeaturedCarousel'
import { VentureOpportunitiesSection } from './VentureOpportunitiesSection'
import { CreateVentureWizard } from './CreateVentureWizard'

const TABS = [
  { id: 'my',            label: 'My Ventures',  icon: Buildings, mobileLabel: 'Mine' },
  { id: 'explore',       label: 'Explore',      icon: Compass,   mobileLabel: 'Explore' },
  { id: 'following',     label: 'Following',    icon: Heart,     mobileLabel: 'Following' },
  { id: 'opportunities', label: 'Opportunities',icon: Handshake, mobileLabel: 'Opps' },
  { id: 'saved',         label: 'Saved',        icon: BookmarkSimple, mobileLabel: 'Saved' },
] as const

type TabId = typeof TABS[number]['id']

const SORT_OPTIONS = [
  { id: 'recommended',   label: 'Recommended' },
  { id: 'traction',      label: 'Top traction' },
  { id: 'most_followed', label: 'Most followed' },
  { id: 'newest',        label: 'Newest' },
] as const

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

function firstName(fullName: string | null | undefined): string {
  if (!fullName) return 'Builder'
  return fullName.split(' ')[0]
}

export function VenturesDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<TabId>('my')
  const [industry, setIndustry] = useState<string>('all')
  const [sort, setSort] = useState<string>('recommended')
  const [sortOpen, setSortOpen] = useState(false)

  const [dashboard, setDashboard] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [allSectors, setAllSectors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [exploreItems, setExploreItems] = useState<any[]>([])
  const [exploreLoading, setExploreLoading] = useState(false)
  const [exploreOffset, setExploreOffset] = useState(0)
  const [exploreHasMore, setExploreHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchOpen, setSearchOpen] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [oppScope, setOppScope] = useState<'foryou' | 'all'>('all')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const observerRef = useRef<HTMLDivElement>(null)

  // Load current user
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, avatar_url, username')
          .eq('id', user.id)
          .maybeSingle()
        setCurrentUser(profile)
      }
    })
  }, [supabase])

  // Fetch dashboard + categories
  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const [d, c] = await Promise.all([
        fetch('/api/ventures/dashboard?industry=' + encodeURIComponent(industry)).then(r => r.json()),
        fetch('/api/ventures/categories').then(r => r.json()),
      ])
      setDashboard(d)
      setCategories(c.categories || [])
      setAllSectors(c.allSectors || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [industry])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  // Explore tab: fetch recommendations
  const fetchExplore = useCallback(async () => {
    if (activeTab !== 'explore') return
    setExploreLoading(true)
    setExploreOffset(0)
    try {
      const url = '/api/ventures/recommendations?industry=' + encodeURIComponent(industry) + '&sort=' + sort + '&limit=24&offset=0'
      const res = await fetch(url)
      const j = await res.json()
      setExploreItems(j.results || [])
      setExploreHasMore((j.results || []).length >= 24)
      setExploreOffset((j.results || []).length)
    } catch (e) { console.error(e) }
    finally { setExploreLoading(false) }
  }, [activeTab, industry, sort])

  useEffect(() => { fetchExplore() }, [fetchExplore])

  // Infinite scroll for Explore
  useEffect(() => {
    if (activeTab !== 'explore') return
    const el = observerRef.current
    if (!el || !exploreHasMore || exploreLoading || loadingMore) return

    const observer = new IntersectionObserver(async (entries) => {
      if (entries[0]?.isIntersecting && !loadingMore && exploreHasMore) {
        setLoadingMore(true)
        try {
          const url = '/api/ventures/recommendations?industry=' + encodeURIComponent(industry) + '&sort=' + sort + '&limit=24&offset=' + exploreOffset
          const res = await fetch(url)
          const j = await res.json()
          const newItems = j.results || []
          setExploreItems(prev => [...prev, ...newItems])
          setExploreOffset(prev => prev + newItems.length)
          setExploreHasMore(newItems.length >= 24)
        } catch (e) { console.error(e) }
        finally { setLoadingMore(false) }
      }
    }, { rootMargin: '400px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [activeTab, exploreHasMore, exploreLoading, loadingMore, exploreOffset, industry, sort])

  // Search
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); setSearchOpen(false); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/ventures/search?q=' + encodeURIComponent(searchQuery))
        const json = await res.json()
        setSearchResults(json.results || [])
        setSearchOpen(true)
      } catch { setSearchResults([]) }
    }, 250)
    return () => clearTimeout(t)
  }, [searchQuery])

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('ventures-search')?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const toggleSave = async (slug: string, currentSaved: boolean) => {
    // Optimistic update
    setExploreItems(prev => prev.map(v => v.slug === slug ? { ...v, user_saved: !currentSaved } : v))
    try {
      const res = await fetch('/api/ventures/' + slug + '/save', { method: 'POST' })
      if (!res.ok) throw new Error()
    } catch {
      setExploreItems(prev => prev.map(v => v.slug === slug ? { ...v, user_saved: currentSaved } : v))
    }
  }

  const dismissVenture = async (slug: string) => {
    setExploreItems(prev => prev.filter(v => v.slug !== slug))
    try {
      await fetch('/api/ventures/' + slug + '/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss' }),
      })
    } catch {}
  }

  return (
    <div className="flex-1 min-h-screen bg-[#0a0a0f] pb-20 xl:pb-0 text-white">
      <div className="flex flex-col xl:flex-row">

        {/* MAIN */}
        <div className="flex-1 min-w-0 px-4 md:px-8 py-5 md:py-7 max-w-full xl:max-w-[calc(100%-380px)]">

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[26px] md:text-[30px] font-bold tracking-tight leading-tight">
                Ventures
              </h1>
              <p className="text-[13px] text-white/50 mt-0.5">
                Build, grow and discover ambitious companies.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-[400px]">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                <Input
                  id="ventures-search"
                  placeholder="Search ventures, industries, founders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                  className="pl-10 pr-16 h-11 bg-white/[0.03] border-white/[0.08] text-white text-[14px] placeholder:text-white/35 rounded-xl focus:ring-purple-500/30 focus:border-purple-500/40"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 text-white/35 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5">
                  <Command size={11} /><span className="text-[10px] font-mono">K</span>
                </div>
                {searchOpen && searchResults.length > 0 && (
                  <div className="absolute z-50 top-12 left-0 right-0 bg-[#0f0f18] border border-white/[0.1] rounded-xl shadow-2xl max-h-[400px] overflow-y-auto">
                    {searchResults.map((r: any) => (
                      <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] cursor-pointer border-b border-white/[0.04] last:border-0"
                        onClick={() => { router.push('/ventures/' + r.slug); setSearchOpen(false); setSearchQuery('') }}>
                        <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {r.logo_url ? <img src={r.logo_url} alt="" className="w-full h-full object-cover" /> : <Buildings size={15} className="text-white/40" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] text-white font-semibold truncate">{r.name}</p>
                          <p className="text-[11px] text-white/45 truncate">{r.venture_number} · {r.industry || r.tagline || 'Venture'}</p>
                        </div>
                        <ArrowUpRight size={13} className="text-white/30" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={() => setCreateOpen(true)}
                className="hidden md:flex bg-white text-black hover:bg-white/90 text-[13px] font-semibold h-11 px-4 rounded-xl"
              >
                <Plus size={14} weight="bold" className="mr-1.5" /> Create venture
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="hidden md:flex items-center border-b border-white/[0.06] mb-5">
            <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
              {TABS.map(tab => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={
                      'px-4 py-3 text-[13px] font-medium whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ' +
                      (active ? 'text-white border-white' : 'text-white/45 border-transparent hover:text-white/85')
                    }
                  >
                    <Icon size={14} weight={active ? 'fill' : 'regular'} />
                    {tab.label}
                    {tab.id === 'my' && dashboard?.stats?.totalMyVentures > 0 && (
                      <span className={'text-[10px] font-bold px-1.5 py-0.5 rounded ' + (active ? 'bg-white/[0.12] text-white' : 'bg-white/[0.06] text-white/60')}>
                        {dashboard.stats.totalMyVentures}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mobile tab label */}
          <div className="md:hidden mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(() => {
                const t = TABS.find(x => x.id === activeTab)
                if (!t) return null
                const Icon = t.icon
                return <><Icon size={16} weight="fill" className="text-purple-400" /><h2 className="text-[15px] font-bold text-white">{t.label}</h2></>
              })()}
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="bg-white text-black hover:bg-white/90 text-[12px] font-semibold px-3 h-8 rounded-lg">
              <Plus size={12} className="mr-1" /> New
            </Button>
          </div>

          {/* ─── CATEGORY PILLS (shared across tabs) ─── */}
          {(activeTab === 'explore' || activeTab === 'my') && (
            <div className="mb-5">
              <VentureCategoryPills
                categories={categories}
                allSectors={allSectors}
                active={industry}
                onChange={setIndustry}
              />
            </div>
          )}

          {/* ─── TAB CONTENT ─── */}

          {loading && !dashboard ? (
            <div className="space-y-6">
              <Skeleton className="h-[280px] bg-white/5 rounded-2xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[340px] bg-white/5 rounded-2xl" />)}
              </div>
            </div>
          ) : (
            <>
              {/* MY VENTURES */}
              {activeTab === 'my' && (
                <>
                  {(dashboard?.myVentures || []).length === 0 ? (
                    <EmptyState
                      icon={Buildings}
                      title="You haven't created a venture yet"
                      subtitle="Turn your idea into a real company. Share it with the world, build a team, attract capital."
                      actionLabel="Create your first venture"
                      onAction={() => setCreateOpen(true)}
                    />
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {(dashboard.myVentures || []).map((v: any) => (
                          <VentureCard
                            key={v.id}
                            venture={v}
                            onOpen={() => router.push('/ventures/' + v.slug)}
                            onToggleSave={() => {}}
                          />
                        ))}
                        <CreateVentureCard onClick={() => setCreateOpen(true)} />
                      </div>

                      {/* Featured section still shows for own tab */}
                      {(dashboard?.featured || []).length > 0 && (
                        <div className="mb-8">
                          <div className="flex items-end justify-between mb-4">
                            <div>
                              <h2 className="text-[19px] font-bold text-white">Featured ventures</h2>
                              <p className="text-[12.5px] text-white/45 mt-0.5">Companies making moves right now</p>
                            </div>
                          </div>
                          <VentureFeaturedCarousel ventures={dashboard.featured} />
                        </div>
                      )}

                      {/* Compact opportunities */}
                      <div>
                        <div className="flex items-end justify-between mb-4">
                          <div>
                            <h2 className="text-[17px] font-bold text-white">Latest opportunities</h2>
                            <p className="text-[12px] text-white/45 mt-0.5">Across ventures on DSRT</p>
                          </div>
                          <button
                            onClick={() => setActiveTab('opportunities')}
                            className="text-[12px] font-semibold text-white/70 hover:text-white flex items-center gap-1"
                          >
                            View all <ArrowRight size={11} />
                          </button>
                        </div>
                        <VentureOpportunitiesSection compact />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* EXPLORE */}
              {activeTab === 'explore' && (
                <>
                  {/* Featured carousel */}
                  {(dashboard?.featured || []).length > 0 && (
                    <div className="mb-8">
                      <VentureFeaturedCarousel ventures={dashboard.featured} />
                    </div>
                  )}

                  {/* Recommended header + sort */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-[19px] font-bold text-white flex items-center gap-2">
                        <Sparkle size={16} weight="fill" className="text-purple-400" />
                        Recommended for you
                        {exploreItems.length > 0 && <span className="text-[12px] text-white/40 font-normal">· {exploreItems.length}</span>}
                      </h2>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setSortOpen(!sortOpen)}
                        className="flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] rounded-lg px-3 h-8 font-medium transition-colors"
                      >
                        Sort: <span className="text-white font-semibold">{SORT_OPTIONS.find(s => s.id === sort)?.label}</span>
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
                                className={'w-full text-left px-3 py-2 text-[12px] hover:bg-white/[0.05] ' + (sort === opt.id ? 'text-purple-400 font-semibold' : 'text-white/85')}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {exploreLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[340px] bg-white/5 rounded-2xl" />)}
                    </div>
                  ) : exploreItems.length === 0 ? (
                    <div className="text-center py-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                      <Buildings size={36} className="mx-auto mb-3 text-white/25" />
                      <p className="text-[14px] text-white/50 font-semibold">No ventures match this filter</p>
                      <p className="text-[12px] text-white/35 mt-1">Try changing industry or sort.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {exploreItems.map((v: any) => (
                          <VentureCard
                            key={v.id}
                            venture={v}
                            onOpen={() => router.push('/ventures/' + v.slug)}
                            onToggleSave={() => toggleSave(v.slug, !!v.user_saved)}
                            onDismiss={() => dismissVenture(v.slug)}
                          />
                        ))}
                      </div>
                      <div ref={observerRef} className="h-20 flex items-center justify-center mt-4">
                        {loadingMore && (
                          <div className="text-white/50 text-[12px] flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            Loading more...
                          </div>
                        )}
                        {!exploreHasMore && exploreItems.length > 0 && (
                          <p className="text-white/30 text-[12px]">You've reached the end</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Opportunities preview inside Explore */}
                  <div className="mt-10 pt-8 border-t border-white/[0.06]">
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <h2 className="text-[17px] font-bold text-white">Opportunities</h2>
                        <p className="text-[12px] text-white/45 mt-0.5">Co-founder, investment, hiring, and more</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('opportunities')}
                        className="text-[12px] font-semibold text-white/70 hover:text-white flex items-center gap-1"
                      >
                        View all <ArrowRight size={11} />
                      </button>
                    </div>
                    <VentureOpportunitiesSection compact />
                  </div>
                </>
              )}

              {/* FOLLOWING */}
              {activeTab === 'following' && (
                <>
                  <h2 className="text-[19px] font-bold text-white mb-4">Ventures you follow</h2>
                  {(dashboard?.following || []).length === 0 ? (
                    <EmptyState
                      icon={Heart}
                      title="You aren't following any ventures yet"
                      subtitle="Follow ventures to keep up with their updates, milestones, and opportunities."
                      actionLabel="Explore ventures"
                      onAction={() => setActiveTab('explore')}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(dashboard.following || []).map((v: any) => (
                        <VentureCard
                          key={v.id}
                          venture={v}
                          onOpen={() => router.push('/ventures/' + v.slug)}
                          onToggleSave={() => {}}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* OPPORTUNITIES */}
              {activeTab === 'opportunities' && (
                <VentureOpportunitiesSection scope={oppScope} onScopeChange={setOppScope} />
              )}

              {/* SAVED */}
              {activeTab === 'saved' && (
                <>
                  <h2 className="text-[19px] font-bold text-white mb-4">Saved ventures</h2>
                  {(dashboard?.saved || []).length === 0 ? (
                    <EmptyState
                      icon={BookmarkSimple}
                      title="Nothing saved yet"
                      subtitle="Bookmark ventures you want to come back to."
                      actionLabel="Browse ventures"
                      onAction={() => setActiveTab('explore')}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(dashboard.saved || []).map((v: any) => (
                        <VentureCard
                          key={v.id}
                          venture={{ ...v, user_saved: true }}
                          onOpen={() => router.push('/ventures/' + v.slug)}
                          onToggleSave={() => toggleSave(v.slug, true)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="w-[380px] flex-shrink-0 border-l border-white/[0.06] px-5 py-7 space-y-4 hidden xl:block sticky top-0 h-screen overflow-y-auto scrollbar-hide">

          {/* COCO strategic banner */}
          <div className="bg-gradient-to-br from-purple-600/[0.15] via-purple-500/[0.05] to-transparent border border-purple-500/25 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Robot size={17} weight="fill" className="text-purple-300" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[14px] font-bold text-white">DSRT COCO</p>
                    <span className="text-[9px] font-bold text-purple-200 bg-purple-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">BETA</span>
                  </div>
                  <p className="text-[11px] text-white/60">Your intelligent work assistant</p>
                </div>
              </div>
              <p className="text-[12.5px] text-white/70 leading-relaxed mb-4">
                Plan, build, automate and grow your venture. COCO helps you make better decisions faster.
              </p>
              <button
                onClick={() => router.push('/projects?tab=wip')}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white text-[12.5px] font-semibold h-9 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                Open COCO <ArrowRight size={12} weight="bold" />
              </button>
            </div>
          </div>

          {/* Create Venture card */}
          <div className="bg-gradient-to-br from-blue-500/[0.08] to-transparent border border-white/[0.08] rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 opacity-15">
              <Rocket size={100} weight="duotone" />
            </div>
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.12] flex items-center justify-center mb-3">
                <Buildings size={17} weight="fill" className="text-blue-300" />
              </div>
              <h3 className="text-[15px] font-bold text-white mb-1">Have a company in mind?</h3>
              <p className="text-[12px] text-white/60 leading-relaxed mb-4">
                Build your venture, bring your team together and grow with DSRT.
              </p>
              <button
                onClick={() => setCreateOpen(true)}
                className="w-full bg-white text-black hover:bg-white/90 text-[13px] font-semibold h-9 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus size={12} weight="bold" /> Create Venture
              </button>
            </div>
          </div>

          {/* Venture Opportunities sidebar preview */}
          <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-white flex items-center gap-2">
                <Handshake size={14} weight="fill" className="text-emerald-300" />
                Opportunities
              </h3>
              <button
                onClick={() => setActiveTab('opportunities')}
                className="text-[11px] font-semibold text-white/60 hover:text-white flex items-center gap-0.5"
              >
                All <ArrowRight size={10} />
              </button>
            </div>
            <p className="text-[11.5px] text-white/50 mb-3 leading-relaxed">
              Co-founder · Hiring · Investment · Partnerships · Advisors
            </p>
            <div className="space-y-1">
              {(dashboard?.opportunities || []).slice(0, 4).map((op: any) => (
                <button
                  key={op.id}
                  onClick={() => router.push('/ventures/' + op.venture_slug)}
                  className="w-full text-left group flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-8 h-8 rounded bg-white/[0.05] border border-white/[0.08] flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {op.venture_logo ? (
                      <img src={op.venture_logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Buildings size={13} weight="fill" className="text-white/40" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-white/90 truncate">{op.venture_name}</p>
                    <p className="text-[10.5px] text-white/50 truncate">
                      <span className="capitalize">{op.type}</span> · {op.title}
                    </p>
                  </div>
                </button>
              ))}
              {(dashboard?.opportunities || []).length === 0 && (
                <p className="text-[11px] text-white/40 py-3 text-center">No open opportunities yet</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile bottom nav */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 py-1.5 flex items-center justify-around">
        {TABS.slice(0, 5).map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={'flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg min-w-[56px] ' + (active ? 'text-white' : 'text-white/45')}>
              <Icon size={20} weight={active ? 'fill' : 'regular'} />
              <span className="text-[10px] font-semibold">{tab.mobileLabel}</span>
            </button>
          )
        })}
      </nav>

      {/* Create wizard */}
      {createOpen && (
        <CreateVentureWizard onClose={() => setCreateOpen(false)} />
      )}
    </div>
  )
}

function CreateVentureCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="min-h-[300px] bg-gradient-to-br from-purple-500/[0.05] to-transparent border-2 border-dashed border-white/[0.1] rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-purple-400/40 hover:bg-purple-500/[0.08] transition-all group"
    >
      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 flex items-center justify-center transition-all">
        <Plus size={28} weight="bold" className="text-purple-300 group-hover:text-purple-200" />
      </div>
      <p className="text-[15px] font-bold text-white">Start a new venture</p>
      <p className="text-[12px] text-white/45 text-center px-8">Turn your idea into a real company</p>
    </div>
  )
}

function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }: {
  icon: any; title: string; subtitle: string; actionLabel?: string; onAction?: () => void
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl py-16 text-center">
      <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-white/[0.06] items-center justify-center mb-4">
        <Icon size={26} className="text-white/40" />
      </div>
      <p className="text-[15px] font-semibold text-white">{title}</p>
      <p className="text-[12.5px] text-white/45 mt-1 max-w-sm mx-auto px-4">{subtitle}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold bg-white text-black hover:bg-white/90 px-4 h-9 rounded-lg"
        >
          {actionLabel} <ArrowRight size={12} weight="bold" />
        </button>
      )}
    </div>
  )
}
