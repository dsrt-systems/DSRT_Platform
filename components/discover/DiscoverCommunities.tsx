'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  MagnifyingGlass, Users, Rocket, MagnifyingGlass as SearchIcon,
  Sparkle, Trophy, TrendUp, Compass, Globe, Plus, FunnelSimple,
  CaretDown, CaretRight, ArrowRight, Check, X, Brain, Robot,
  GitBranch, Code, PaintBrush, Heartbeat, GraduationCap,
  Briefcase, CurrencyDollar, Cpu, ArrowsClockwise, Heart,
  BookmarkSimple, MapPin, ChartLineUp, Flame, Star,
  Buildings, ChatCircle, CalendarBlank, ShareNetwork,
  CaretLeft, MinusCircle,
} from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'

const ICON_MAP: Record<string, any> = {
  Cpu, Rocket, Brain, PaintBrush, MagnifyingGlass, CurrencyDollar,
  Heartbeat, GraduationCap, Briefcase, Users, Robot, GitBranch, Code,
  Sparkle, Trophy, Flame,
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  blue:   { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30', gradient: 'from-blue-500/20 to-blue-600/10' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30', gradient: 'from-purple-500/20 to-purple-600/10' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30', gradient: 'from-orange-500/20 to-orange-600/10' },
  green:  { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30', gradient: 'from-green-500/20 to-green-600/10' },
  pink:   { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/30', gradient: 'from-pink-500/20 to-pink-600/10' },
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30', gradient: 'from-yellow-500/20 to-yellow-600/10' },
  red:    { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', gradient: 'from-red-500/20 to-red-600/10' },
  cyan:   { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/30', gradient: 'from-cyan-500/20 to-cyan-600/10' },
  gray:   { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/30', gradient: 'from-gray-500/20 to-gray-600/10' },
}

const TABS = [
  { id: 'featured', label: 'Featured', icon: Sparkle },
  { id: 'trending', label: 'Trending', icon: TrendUp },
  { id: 'newest', label: 'Newest', icon: Flame },
  { id: 'recommended', label: 'Recommended', icon: Star },
  { id: 'foryou', label: 'For You', icon: Compass },
]

interface DiscoverProps {
  currentUser: any
}

export function DiscoverCommunities({ currentUser }: DiscoverProps) {
  const supabase = createClient()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState('featured')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [featuredCommunities, setFeaturedCommunities] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [trendingCommunities, setTrendingCommunities] = useState<any[]>([])
  const [recommendedSidebar, setRecommendedSidebar] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [loadingMain, setLoadingMain] = useState(false)

  // ============================================
  // Load data
  // ============================================
  const loadStats = useCallback(async () => {
    const res = await fetch('/api/discover/stats')
    const data = await res.json()
    setStats(data.stats)
  }, [])

  const loadFeatured = useCallback(async () => {
    setLoadingMain(true)
    try {
      const endpoint =
        activeTab === 'featured' ? '/api/discover/featured' :
        activeTab === 'trending' ? '/api/discover/trending' :
        activeTab === 'newest' ? '/api/discover/newest' :
        activeTab === 'recommended' ? '/api/discover/recommended' :
        '/api/discover/foryou'

      const res = await fetch(endpoint)
      const data = await res.json()

      if (activeTab === 'foryou') {
        // Extract communities from mixed feed
        setFeaturedCommunities(data.items?.filter((i: any) => i.type === 'community').map((i: any) => i.data) || [])
      } else {
        setFeaturedCommunities(data.communities || [])
      }
    } finally {
      setLoadingMain(false)
    }
  }, [activeTab])

  const loadCategories = useCallback(async () => {
    const res = await fetch('/api/discover/categories')
    const data = await res.json()
    setCategories(data.categories || [])
  }, [])

  const loadTrending = useCallback(async () => {
    const res = await fetch('/api/discover/trending?limit=5')
    const data = await res.json()
    setTrendingCommunities(data.communities || [])
  }, [])

  const loadRecommended = useCallback(async () => {
    const res = await fetch('/api/discover/recommended?limit=5')
    const data = await res.json()
    setRecommendedSidebar(data.communities || [])
  }, [])

  const loadActivity = useCallback(async () => {
    const res = await fetch('/api/discover/activity?limit=6')
    const data = await res.json()
    setActivity(data.activity || [])
  }, [])

  const loadJoined = useCallback(async () => {
    const { data } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', currentUser.id)
    setJoinedIds(new Set((data || []).map(r => r.community_id)))

    const { data: saved } = await supabase
      .from('community_bookmarks')
      .select('community_id')
      .eq('user_id', currentUser.id)
    setSavedIds(new Set((saved || []).map(r => r.community_id)))
  }, [currentUser.id, supabase])

  useEffect(() => {
    loadStats()
    loadCategories()
    loadTrending()
    loadRecommended()
    loadActivity()
    loadJoined()

    // Auto-refresh every 3 min
    const interval = setInterval(() => {
      loadStats()
      loadActivity()
      loadTrending()
    }, 3 * 60 * 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadFeatured()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Realtime: new community joined
  useEffect(() => {
    const channel = supabase
      .channel('discover-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_members',
        filter: `user_id=eq.${currentUser.id}`,
      }, (payload) => {
        setJoinedIds(prev => new Set(prev).add((payload.new as any).community_id))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id])

  const handleJoin = async (communityId: string) => {
    setJoinedIds(prev => new Set(prev).add(communityId))
    const res = await fetch('/api/discover/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ community_id: communityId }),
    })
    if (res.ok) {
      toast.success('Joined community')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to join')
      setJoinedIds(prev => {
        const next = new Set(prev)
        next.delete(communityId)
        return next
      })
    }
  }

  const handleSave = async (communityId: string) => {
    const isSaved = savedIds.has(communityId)
    if (isSaved) {
      setSavedIds(prev => {
        const next = new Set(prev)
        next.delete(communityId)
        return next
      })
      await fetch(`/api/discover/save?community_id=${communityId}`, { method: 'DELETE' })
      toast.success('Removed from saved')
    } else {
      setSavedIds(prev => new Set(prev).add(communityId))
      await fetch('/api/discover/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ community_id: communityId }),
      })
      toast.success('Saved to bookmarks')
    }
  }

  const handleDismiss = async (communityId: string) => {
    setRecommendedSidebar(prev => prev.filter(c => c.id !== communityId))
    await fetch('/api/discover/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ community_id: communityId }),
    })
  }

  const format1 = (n: number) => {
    if (!n) return '0'
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`
    return n.toLocaleString()
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 p-4 md:p-6">
        {/* ==================== MAIN COLUMN ==================== */}
        <div className="min-w-0 space-y-5">
          {/* HERO */}
          <div className="bg-card border rounded-2xl p-6 relative overflow-hidden">
            {/* Animated globe backdrop */}
            <div className="absolute top-0 right-0 w-96 h-96 opacity-30 pointer-events-none">
              <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full blur-3xl animate-pulse" />
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold tracking-tight">Discover Communities</h1>
                <Sparkle className="w-6 h-6 text-purple-500" weight="fill" />
              </div>
              <p className="text-sm text-muted-foreground max-w-lg">
                Connect with builders, creators, innovators and dreamers from around the world.
              </p>

              {/* Live Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mt-6">
                <StatBadge icon={Users} color="blue" label="Total Communities" value={format1(stats?.total_communities || 0)} />
                <StatBadge icon={Sparkle} color="purple" label="Active Members" value={format1(stats?.total_members || 0)} />
                <StatBadge icon={Code} color="pink" label="Active Projects" value={format1(stats?.total_projects || 0)} />
                <StatBadge icon={Rocket} color="orange" label="Active Ventures" value={format1(stats?.total_ventures || 0)} />
                <StatBadge icon={SearchIcon} color="green" label="Looking For People" value={format1(stats?.total_looking_for || 0)} />
                <StatBadge icon={Globe} color="cyan" label="Countries" value={`${stats?.total_countries || 0}+`} />
              </div>
            </div>
          </div>

          {/* TABS + FILTER */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-1">
              {TABS.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary border-b-2 border-primary rounded-b-none'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" weight={isActive ? 'fill' : 'regular'} />
                    {tab.label}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <CategoryFilter
                categories={categories}
                value={categoryFilter}
                onChange={setCategoryFilter}
              />
              <button className="h-9 px-3 bg-muted/40 border rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-muted/60">
                <FunnelSimple className="w-3.5 h-3.5" weight="bold" />
                Filters
              </button>
            </div>
          </div>

          {/* FEATURED COMMUNITIES */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold capitalize">{activeTab} Communities</h2>
              <button className="text-xs text-blue-500 hover:underline">View all</button>
            </div>

            {loadingMain ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                {[1,2,3,4,5].map(i => <CommunityCardSkeleton key={i} />)}
              </div>
            ) : featuredCommunities.length === 0 ? (
              <div className="text-center py-12 bg-card border rounded-2xl">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" weight="duotone" />
                <p className="text-sm text-muted-foreground">No communities yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                {featuredCommunities.slice(0, 5).map((c: any, idx: number) => (
                  <CommunityCard
                    key={c.id}
                    community={c}
                    index={idx}
                    isJoined={joinedIds.has(c.id)}
                    isSaved={savedIds.has(c.id)}
                    onJoin={() => handleJoin(c.id)}
                    onSave={() => handleSave(c.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* POPULAR CATEGORIES */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">Popular Categories</h2>
              <button className="text-xs text-blue-500 hover:underline">View all</button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-9 gap-2">
              {categories.slice(0, 8).map((cat: any, idx: number) => (
                <CategoryCard key={idx} category={cat} onSelect={() => setCategoryFilter(cat.slug)} />
              ))}
              <button className="bg-card border rounded-2xl p-3 flex flex-col items-center justify-center gap-1 hover:border-primary/40 hover:bg-muted/30 transition-all">
                <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center">
                  <span className="text-lg">···</span>
                </div>
                <p className="text-[10px] font-bold">More</p>
              </button>
            </div>
          </div>

          {/* TRENDING COMMUNITIES */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">Trending Communities</h2>
              <button className="text-xs text-blue-500 hover:underline">View all</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {trendingCommunities.length === 0 ? (
                <div className="col-span-full text-center py-6">
                  <p className="text-xs text-muted-foreground">No trending communities yet</p>
                </div>
              ) : (
                trendingCommunities.slice(0, 5).map((c: any) => (
                  <TrendingCard key={c.id} community={c} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ==================== RIGHT SIDEBAR ==================== */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide pb-6">
            <WhyJoinPanel />
            <RecommendedSidebar
              communities={recommendedSidebar}
              joinedIds={joinedIds}
              onJoin={handleJoin}
              onDismiss={handleDismiss}
            />
            <ActivityPanel activity={activity} />
            <CreateCommunityPanel />
          </div>
        </aside>
      </div>
    </div>
  )
}

// ============================================
// SUB COMPONENTS
// ============================================

function StatBadge({ icon: Icon, color, label, value }: any) {
  const colors = COLOR_MAP[color]
  return (
    <div className="bg-card border rounded-xl p-3">
      <div className="flex items-center gap-2">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', colors.bg)}>
          <Icon className={cn('w-4 h-4', colors.text)} weight="fill" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold tabular-nums leading-tight">{value}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider truncate">{label}</p>
        </div>
      </div>
    </div>
  )
}

function CategoryFilter({ categories, value, onChange }: any) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = categories.find((c: any) => c.slug === value)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'h-9 px-3 border rounded-lg text-xs font-semibold flex items-center gap-1.5 min-w-[140px]',
          value ? 'bg-primary/10 text-primary border-primary/40' : 'bg-muted/40 hover:bg-muted/60'
        )}
      >
        <span className="truncate flex-1 text-left">{selected?.label || 'All Categories'}</span>
        <CaretDown className="w-3 h-3" weight="bold" />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-card border rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto py-1">
          <button
            onClick={() => { onChange(''); setOpen(false) }}
            className={cn('w-full text-left px-3 py-2 text-xs hover:bg-muted flex justify-between', !value && 'bg-primary/10 text-primary')}
          >
            All Categories
            {!value && <Check className="w-3 h-3" weight="bold" />}
          </button>
          {categories.map((c: any) => (
            <button
              key={c.slug}
              onClick={() => { onChange(c.slug); setOpen(false) }}
              className={cn('w-full text-left px-3 py-2 text-xs hover:bg-muted flex justify-between items-center', value === c.slug && 'bg-primary/10 text-primary')}
            >
              <span>{c.label}</span>
              <span className="text-[10px] text-muted-foreground">{c.community_count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CommunityCard({ community, index, isJoined, isSaved, onJoin, onSave }: any) {
  const router = useRouter()
  const colors = COLOR_MAP[community.icon_color] || COLOR_MAP.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all group"
    >
      {/* Cover */}
      <div
        onClick={() => router.push(`/community/${community.slug}`)}
        className={cn('h-24 relative cursor-pointer bg-gradient-to-br', colors.gradient)}
        style={community.cover_url ? { backgroundImage: `url(${community.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="p-3.5 -mt-8 relative">
        {/* Logo */}
        <div className="w-14 h-14 rounded-xl bg-white border-4 border-background shadow-md flex items-center justify-center mb-2 overflow-hidden">
          <span className="text-lg font-bold text-red-600">{community.name?.[0]}</span>
        </div>

        {/* Name */}
        <Link href={`/community/${community.slug}`} className="flex items-center gap-1 hover:underline">
          <p className="text-sm font-bold truncate">{community.name}</p>
          {community.is_verified && <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" weight="bold" />}
        </Link>

        {/* Description */}
        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
          {community.description}
        </p>

        {/* Tags */}
        {Array.isArray(community.tags) && community.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {community.tags.slice(0, 2).map((t: string) => (
              <span key={t} className="text-[9px] px-1.5 py-0.5 bg-muted rounded font-medium">{t}</span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-1 mt-3 pt-3 border-t">
          <div>
            <p className="text-xs font-bold tabular-nums">{formatNumber(community.member_count || 0)}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Members</p>
          </div>
          <div>
            <p className="text-xs font-bold tabular-nums">{formatNumber(community.project_count || 0)}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Projects</p>
          </div>
          <div>
            <p className="text-xs font-bold tabular-nums">{formatNumber(community.venture_count || 0)}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Ventures</p>
          </div>
        </div>

        {/* Join button */}
        <Button
          size="sm"
          variant={isJoined ? 'secondary' : 'default'}
          onClick={() => !isJoined && onJoin()}
          disabled={isJoined}
          className="w-full mt-3 h-8 text-xs"
        >
          {isJoined ? (
            <><Check className="w-3.5 h-3.5 mr-1" weight="bold" /> Joined</>
          ) : (
            'Join'
          )}
        </Button>
      </div>
    </motion.div>
  )
}

function CommunityCardSkeleton() {
  return (
    <div className="bg-card border rounded-2xl overflow-hidden animate-pulse">
      <div className="h-24 bg-muted/40" />
      <div className="p-3.5 -mt-8">
        <div className="w-14 h-14 rounded-xl bg-muted border-4 border-background" />
        <div className="h-3 bg-muted rounded w-3/4 mt-2" />
        <div className="h-2 bg-muted/60 rounded w-full mt-2" />
        <div className="h-2 bg-muted/60 rounded w-2/3 mt-1" />
        <div className="h-8 bg-muted rounded mt-4" />
      </div>
    </div>
  )
}

function CategoryCard({ category, onSelect }: any) {
  const Icon = ICON_MAP[category.icon] || Users
  const colors = COLOR_MAP[category.color] || COLOR_MAP.blue

  return (
    <button
      onClick={onSelect}
      className="bg-card border rounded-2xl p-3 flex flex-col items-center gap-1.5 hover:border-primary/40 hover:bg-muted/30 transition-all group"
    >
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.bg)}>
        <Icon className={cn('w-5 h-5', colors.text)} weight="fill" />
      </div>
      <p className="text-[10px] font-bold text-center">{category.label}</p>
      <p className="text-[9px] text-muted-foreground">{formatNumber(category.community_count)}+</p>
    </button>
  )
}

function TrendingCard({ community }: any) {
  const router = useRouter()
  const colors = COLOR_MAP[community.icon_color] || COLOR_MAP.blue

  return (
    <div
      onClick={() => router.push(`/community/${community.slug}`)}
      className="bg-card border rounded-xl p-3 hover:border-primary/40 transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-2.5">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', colors.bg)}>
          <Users className={cn('w-5 h-5', colors.text)} weight="fill" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-xs font-bold truncate">{community.name}</p>
            {community.is_verified && <Check className="w-3 h-3 text-blue-500 flex-shrink-0" weight="bold" />}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {formatNumber(community.member_count)} members
          </p>
          {community.growth_pct > 0 && (
            <p className="text-[10px] text-green-500 font-bold mt-0.5 flex items-center gap-0.5">
              <TrendUp className="w-2.5 h-2.5" weight="fill" />
              +{community.growth_pct}%
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== RIGHT SIDEBAR ====================

function WhyJoinPanel() {
  const reasons = [
    { icon: Compass, color: 'blue', title: 'Discover Opportunities', desc: 'Find projects, ventures and people with similar interests.' },
    { icon: Users, color: 'purple', title: 'Build Together', desc: 'Collaborate, learn and create impact together.' },
    { icon: ChartLineUp, color: 'green', title: 'Grow Your Network', desc: 'Connect with builders, mentors and industry experts.' },
    { icon: ShareNetwork, color: 'pink', title: 'Share & Learn', desc: 'Share knowledge, resources and stay updated.' },
  ]

  return (
    <div className="bg-card border rounded-2xl p-4">
      <p className="text-sm font-bold mb-3">Why Join Communities?</p>
      <div className="space-y-3">
        {reasons.map((r, i) => {
          const Icon = r.icon
          const colors = COLOR_MAP[r.color]
          return (
            <div key={i} className="flex items-start gap-2.5">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', colors.bg)}>
                <Icon className={cn('w-4 h-4', colors.text)} weight="fill" />
              </div>
              <div>
                <p className="text-xs font-bold">{r.title}</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{r.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RecommendedSidebar({ communities, joinedIds, onJoin, onDismiss }: any) {
  return (
    <div className="bg-card border rounded-2xl overflow-hidden">
      <div className="p-3.5 border-b flex items-center justify-between">
        <p className="text-sm font-bold">Recommended For You</p>
        <button className="text-xs text-blue-500 hover:underline">View all</button>
      </div>
      {communities.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Complete your profile to see matches</p>
      ) : (
        <div className="divide-y">
          {communities.slice(0, 5).map((c: any) => (
            <div key={c.id} className="p-3 flex items-center gap-2.5 hover:bg-muted/20 transition-colors group">
              <Link href={`/community/${c.slug}`} className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {c.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.cover_url} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-5 h-5 text-muted-foreground" weight="fill" />
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/community/${c.slug}`} className="text-xs font-bold truncate hover:underline block">
                  {c.name}
                </Link>
                <p className="text-[10px] text-muted-foreground">{formatNumber(c.member_count)} members</p>
              </div>
              {joinedIds.has(c.id) ? (
                <Button size="sm" variant="secondary" disabled className="h-6 text-[10px]">
                  Joined
                </Button>
              ) : (
                <Button size="sm" onClick={() => onJoin(c.id)} className="h-6 text-[10px]">
                  Join
                </Button>
              )}
              <button
                onClick={() => onDismiss(c.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                title="Not interested"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" weight="bold" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActivityPanel({ activity }: any) {
  return (
    <div className="bg-card border rounded-2xl overflow-hidden">
      <div className="p-3.5 border-b flex items-center justify-between">
        <p className="text-sm font-bold">Community Activity</p>
        <span className="text-[10px] text-muted-foreground">24h</span>
      </div>
      {activity.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No recent activity</p>
      ) : (
        <div className="divide-y">
          {activity.slice(0, 6).map((a: any, idx: number) => {
            const Icon = ICON_MAP[a.icon] || Sparkle
            const colors = COLOR_MAP[a.color] || COLOR_MAP.blue
            return (
              <Link
                key={idx}
                href={`/community/${a.community_slug}`}
                className="p-3 flex items-start gap-2.5 hover:bg-muted/20 transition-colors"
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', colors.bg)}>
                  <Icon className={cn('w-4 h-4', colors.text)} weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] leading-tight">
                    <span className="font-semibold">{a.community_name}</span>{' '}
                    <span className="text-muted-foreground">{a.title.split(' ').slice(1).join(' ')}</span>
                  </p>
                  {a.subtitle && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{a.subtitle}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: false })} ago
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CreateCommunityPanel() {
  return (
    <div className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-purple-500/20 rounded-2xl p-4 relative overflow-hidden">
      <div className="relative">
        <p className="text-sm font-bold mb-1">Create Your Own Community</p>
        <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
          Build your community, bring people together around your passion and purpose.
        </p>
        <Button size="sm" className="w-full h-8 text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          Start Creating
        </Button>
      </div>
    </div>
  )
}

function formatNumber(n: number): string {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString()
}