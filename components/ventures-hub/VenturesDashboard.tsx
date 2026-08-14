'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  MagnifyingGlass, Plus, Rocket, Lightning, Heart, Users, Briefcase,
  CaretRight, CaretLeft, Command, ArrowRight, Robot, Compass,
  BookOpen, ChatsCircle, DotsThreeOutline, X, Sparkle,
  Crown, HandWaving, Brain, Code, Wrench, Network, Fire,
  Eye, TrendUp, TrendDown, ArrowUpRight, Building, CurrencyDollar,
  Flame, ArrowsClockwise as Refresh, Circle, Lightbulb, Star, Package,
  UsersThree, Bell, ChartLineUp, Target, ChatCircle, Activity
} from '@phosphor-icons/react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'

interface Venture {
  id: string
  slug: string
  name: string
  tagline?: string | null
  description?: string | null
  logo_url?: string | null
  stage?: string
  status?: string
  industry?: string | null
  sector?: string | null
  growth_status?: string
  venture_number?: string | null
  follower_count: number
  view_count: number
  connection_count: number
  application_count: number
  update_count: number
  open_roles: number
  save_count: number
  health_score: number
  profile_completeness: number
  traction_score: number
  is_verified: boolean
  is_building_public: boolean
  is_hiring: boolean
  seeking_investment: boolean
  seeking_cofounder: boolean
  seeking_advisor: boolean
  seeking_partner: boolean
  last_activity_at: string
  updated_at: string
  created_at: string
  key_metric_label?: string | null
  key_metric_value?: string | null
  revenue_range?: string | null
  user_count?: string | null
  monthly_growth?: string | null
  team_count?: number
  product_count?: number
  open_roles_count?: number
  update_count_actual?: number
  latest_metric?: any
}

interface VentureActivity {
  id: string
  type: string
  title: string
  subtitle?: string | null
  icon?: string | null
  color?: string | null
  created_at: string
  venture_id: string
}

const TABS = [
  { id: 'my-ventures', label: 'My Ventures', icon: Rocket, mobileLabel: 'Mine' },
  { id: 'explore', label: 'Explore', icon: Compass, mobileLabel: 'Explore' },
  { id: 'following', label: 'Following', icon: Heart, mobileLabel: 'Following' },
  { id: 'coco', label: 'COCO Assistant', icon: Robot, mobileLabel: 'COCO' },
  { id: 'resources', label: 'Resources', icon: BookOpen, mobileLabel: 'Resources' },
  { id: 'discussions', label: 'Discussions', icon: ChatsCircle, mobileLabel: 'Discuss' },
] as const

type TabId = typeof TABS[number]['id']
const MOBILE_PRIMARY_TABS: TabId[] = ['my-ventures', 'explore', 'following', 'coco']
const MOBILE_MORE_TABS: TabId[] = ['resources', 'discussions']

const STAGE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  idea:       { bg: 'bg-purple-500/12',  text: 'text-purple-200',  dot: 'bg-purple-400' },
  mvp:        { bg: 'bg-blue-500/12',    text: 'text-blue-200',    dot: 'bg-blue-400' },
  beta:       { bg: 'bg-cyan-500/12',    text: 'text-cyan-200',    dot: 'bg-cyan-400' },
  launched:   { bg: 'bg-green-500/12',   text: 'text-green-200',   dot: 'bg-green-400' },
  scaling:    { bg: 'bg-pink-500/12',    text: 'text-pink-200',    dot: 'bg-pink-400' },
  active:     { bg: 'bg-emerald-500/12', text: 'text-emerald-200', dot: 'bg-emerald-400' },
  building:   { bg: 'bg-cyan-500/12',    text: 'text-cyan-200',    dot: 'bg-cyan-400' },
}

const STAGE_LABELS: Record<string, string> = {
  idea: 'IDEA', mvp: 'MVP', beta: 'BETA', launched: 'LAUNCHED', scaling: 'SCALING',
  active: 'ACTIVE', building: 'BUILDING',
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'now'
  if (diffMin < 60) return diffMin + 'm ago'
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return diffHours + 'h ago'
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return diffDays + 'd ago'
  return Math.floor(diffDays / 7) + 'w ago'
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

function firstName(fullName: string | null | undefined): string {
  if (!fullName) return 'Founder'
  return fullName.split(' ')[0]
}

function getActivityIcon(type: string) {
  const map: Record<string, React.ReactNode> = {
    venture_created: <Rocket weight="fill" className="text-purple-400" />,
    member_joined: <Users weight="fill" className="text-emerald-400" />,
    update_posted: <ChatsCircle weight="fill" className="text-blue-400" />,
    metric_updated: <ChartLineUp weight="fill" className="text-cyan-400" />,
    follower_gained: <Heart weight="fill" className="text-rose-400" />,
    funding_added: <CurrencyDollar weight="fill" className="text-green-400" />,
    role_posted: <Briefcase weight="fill" className="text-orange-400" />,
    milestone_reached: <Star weight="fill" className="text-yellow-400" />,
    partner_added: <Building weight="fill" className="text-pink-400" />,
  }
  return map[type] || <Sparkle weight="fill" className="text-white/50" />
}

function CocoVentureBanner({ onOpen, onOpenPro }: { onOpen: () => void; onOpenPro?: () => void }) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl bg-[#0d0620]"
      style={{ aspectRatio: '340 / 480' }}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#1a0b3d] via-[#2d0e5c] to-[#0a0420]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

      <div className="absolute inset-0 p-4 flex flex-col text-white">
        <div className="flex items-start justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-purple-400/25 rounded-full pl-1.5 pr-2 py-[3px]">
            <Sparkle weight="fill" className="text-purple-200" style={{ width: 10, height: 10 }} />
            <span className="text-[10px] font-semibold">COCO VENTURE</span>
            <span className="text-[8px] font-bold bg-purple-500 text-white px-1 rounded">BETA</span>
          </div>
          <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-md px-2 py-0.5 text-right">
            <p className="text-[7.5px] text-white/60 leading-tight">Powered by</p>
            <p className="text-[9px] font-bold leading-tight">DSRT AI</p>
          </div>
        </div>

        <div className="mt-4 max-w-[62%]">
          <h3 className="text-[16px] font-bold leading-[1.15]">
            <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">COCO</span> for founders
          </h3>
          <p className="text-[15px] font-bold leading-[1.15] text-white/95">Ship your venture.</p>
          <p className="text-[10.5px] text-white/70 leading-snug mt-1.5">
            Pitch, plan, raise, hire. Your AI co-founder that never sleeps.
          </p>
        </div>

        <div className="mt-3.5 space-y-1.5 max-w-[62%]">
          {[
            { icon: Target, text: 'Investor readiness', color: 'text-purple-300' },
            { icon: ChartLineUp, text: 'Growth analysis', color: 'text-cyan-300' },
            { icon: Brain, text: 'Market intelligence', color: 'text-emerald-300' },
            { icon: Network, text: 'Founder matching', color: 'text-pink-300' },
          ].map((cap, i) => {
            const Icon = cap.icon
            return (
              <div key={i} className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-white/[0.08] rounded-md pl-1.5 pr-2 py-1">
                <div className="w-5 h-5 rounded bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <Icon size={10} weight="fill" className={cap.color} />
                </div>
                <span className="text-[10.5px] font-medium text-white/90">{cap.text}</span>
              </div>
            )
          })}
        </div>

        <div className="flex-1" />

        <button
          onClick={onOpenPro}
          className="w-full bg-black/55 backdrop-blur-md border border-white/[0.1] hover:border-yellow-400/40 hover:bg-black/70 rounded-lg p-2.5 mb-2 text-left transition-all group"
        >
          <div className="flex items-center gap-1.5">
            <Crown size={12} weight="fill" className="text-yellow-400" />
            <p className="text-[11px] font-bold">COCO Pro</p>
            <span className="text-[8px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-1 py-[1px] rounded">PRO</span>
            <ArrowUpRight size={10} className="text-white/40 ml-auto group-hover:text-yellow-400" />
          </div>
          <p className="text-[9.5px] text-white/60 mt-0.5 leading-snug">Advanced pitch deck AI - Investor CRM - Growth automation</p>
        </button>

        <button
          onClick={onOpen}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/30 py-2.5"
          style={{ fontSize: '12px' }}
        >
          <Sparkle size={12} weight="fill" />
          Open COCO
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}

function CreateVentureBanner({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/[0.08] shadow-xl" style={{ aspectRatio: '340 / 220' }}>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#1a0b3d] via-[#2d1266] to-[#0a0420] flex items-center justify-end pr-4">
        <Rocket size={100} className="text-purple-400/30" weight="duotone" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
      <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
        <div className="max-w-[68%]">
          <div className="flex items-center gap-1 mb-1">
            <Lightbulb size={11} weight="fill" className="text-yellow-300" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-300">Have an idea?</span>
          </div>
          <h3 className="text-[17px] font-bold leading-tight">
            <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Launch</span> your venture.
          </h3>
          <p className="text-[10.5px] text-white/70 leading-snug mt-1.5">Build your company page, attract co-founders, raise capital.</p>
        </div>
        <button
          onClick={onCreate}
          className="w-full bg-white/[0.08] backdrop-blur-md border border-white/25 hover:bg-white hover:text-black text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 py-2"
          style={{ fontSize: '12px' }}
        >
          <Plus size={12} weight="bold" />
          Create Venture
        </button>
      </div>
    </div>
  )
}

export function VenturesDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const [activeTab, setActiveTab] = useState<TabId>('my-ventures')
  const [ventures, setVentures] = useState<Venture[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [analyticsDays, setAnalyticsDays] = useState(30)
  const [showAllVentures, setShowAllVentures] = useState(false)
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [followingVentures, setFollowingVentures] = useState<any[]>([])
  const [feed, setFeed] = useState<VentureActivity[]>([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [feedRefreshing, setFeedRefreshing] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<any>(null)

  const stats = useMemo(() => ({
    totalVentures: ventures.length,
    activeVentures: ventures.filter(v => v.status === 'active').length,
    totalTeam: ventures.reduce((s, v) => s + (v.team_count || 0), 0),
    totalRoles: ventures.reduce((s, v) => s + (v.open_roles_count || 0), 0),
    totalFollowers: ventures.reduce((s, v) => s + v.follower_count, 0),
    totalApplications: ventures.reduce((s, v) => s + v.application_count, 0),
  }), [ventures])

  const smartInsight = useMemo(() => {
    if (ventures.length === 0) {
      return { icon: Rocket, tint: 'text-purple-300', text: 'Ready to launch your first venture? Turn your idea into reality.' }
    }
    if (stats.totalRoles > 0) {
      return { icon: Briefcase, tint: 'text-orange-300', text: stats.totalRoles + ' open role' + (stats.totalRoles !== 1 ? 's are' : ' is') + ' live - share your venture to attract builders.' }
    }
    const raising = ventures.filter(v => v.seeking_investment).length
    if (raising > 0) {
      return { icon: CurrencyDollar, tint: 'text-green-300', text: raising + ' of your ventures ' + (raising === 1 ? 'is' : 'are') + ' raising. Update your pitch deck.' }
    }
    if (stats.totalApplications > 0) {
      return { icon: Bell, tint: 'text-cyan-300', text: 'You have ' + stats.totalApplications + ' pending application' + (stats.totalApplications !== 1 ? 's' : '') + '. Review them.' }
    }
    return null
  }, [ventures, stats])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, avatar_url, username, streak_days')
          .eq('id', user.id)
          .maybeSingle()
        setCurrentUser(profile)
      }
    })
  }, [supabase])

  const fetchVentures = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/ventures/my')
      const json = await res.json()
      setVentures(json.ventures || [])
    } catch (e) { console.error('Ventures fetch:', e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchVentures() }, [fetchVentures])

  useEffect(() => {
    if (activeTab === 'following') {
      fetch('/api/ventures/following')
        .then(r => r.json())
        .then(d => setFollowingVentures(d.ventures || []))
        .catch(() => {})
    }
  }, [activeTab])

  const fetchFeed = useCallback(async (silent = false) => {
    if (!silent) setFeedLoading(true)
    else setFeedRefreshing(true)
    try {
      const res = await fetch('/api/ventures/activity?limit=40', { cache: 'no-store' })
      if (res.ok) {
        const j = await res.json()
        setFeed(j.activity || [])
      }
    } catch (e) { console.error('Feed:', e) }
    finally { setFeedLoading(false); setFeedRefreshing(false) }
  }, [])

  useEffect(() => {
    fetchFeed(false)
    const interval = setInterval(() => fetchFeed(true), 30000)
    return () => clearInterval(interval)
  }, [fetchFeed])

  useEffect(() => {
    if (ventures.length === 0) return
    const aggregate = async () => {
      try {
        const promises = ventures.slice(0, 5).map(v =>
          fetch('/api/ventures/' + v.slug + '/analytics?days=' + analyticsDays).then(r => r.json()).catch(() => null)
        )
        const results = await Promise.all(promises)
        const valid = results.filter(r => r && r.analytics)

        const dateMap: Record<string, any> = {}
        valid.forEach(r => {
          (r.analytics || []).forEach((d: any) => {
            if (!dateMap[d.date]) dateMap[d.date] = { date: d.date, views: 0, unique_views: 0, followers: 0, applications: 0 }
            dateMap[d.date].views += d.views || 0
            dateMap[d.date].unique_views += d.unique_views || 0
            dateMap[d.date].followers += d.new_followers || 0
            dateMap[d.date].applications += d.applications || 0
          })
        })
        const viewsOverTime = Object.values(dateMap).sort((a: any, b: any) => a.date.localeCompare(b.date))

        const sources: Record<string, number> = {}
        valid.forEach(r => {
          Object.entries(r.sources || {}).forEach(([k, v]) => {
            sources[k] = (sources[k] || 0) + (v as number)
          })
        })
        const totalSources = Object.values(sources).reduce((s: number, v: number) => s + v, 0)
        const trafficSources = Object.entries(sources).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          percentage: totalSources > 0 ? Math.round((value / totalSources) * 100) : 0
        }))

        const summary = valid.reduce((acc, r) => {
          const s = r.summary || {}
          acc.totalViews += s.totalViews || 0
          acc.totalFollowers += s.totalFollowers || 0
          acc.totalApplications += s.totalApplications || 0
          acc.totalSaves += s.totalSaves || 0
          return acc
        }, { totalViews: 0, totalFollowers: 0, totalApplications: 0, totalSaves: 0 })

        setAnalyticsData({ viewsOverTime, trafficSources, summary })
      } catch (e) { console.error('Analytics:', e) }
    }
    aggregate()
  }, [ventures, analyticsDays])

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); setSearchOpen(false); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/ventures/search?q=' + encodeURIComponent(searchQuery))
        const json = await res.json()
        setSearchResults(json.ventures || [])
        setSearchOpen(true)
      } catch { setSearchResults([]) }
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('venture-search')?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => {
    ref.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' })
  }

  const openAssistant = () => setActiveTab('coco')

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-[#0a0a0f] pb-20 xl:pb-0">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
          <Skeleton className="h-10 w-72 bg-white/5 mb-3" />
          <Skeleton className="h-5 w-96 bg-white/5 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 bg-white/5 rounded-xl" />)}
          </div>
          <Skeleton className="h-6 w-40 bg-white/5 mb-4" />
          <div className="flex gap-4 mb-8">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[300px] w-[320px] bg-white/5 rounded-2xl flex-shrink-0" />)}
          </div>
        </div>
      </div>
    )
  }

  const streak = currentUser?.streak_days || 0

  return (
    <div className="flex-1 min-h-screen bg-[#0a0a0f] pb-20 xl:pb-0 text-white">
      <div className="flex flex-col xl:flex-row">
        <div className="flex-1 min-w-0 px-4 md:px-8 py-5 md:py-7 max-w-full xl:max-w-[calc(100%-380px)]">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[26px] md:text-[30px] font-bold tracking-tight leading-tight">
                {greeting()}, <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">{firstName(currentUser?.full_name)}</span>
              </h1>
              <p className="text-[13px] text-white/50 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Here is what is happening across your ventures.</span>
                {streak > 0 && (
                  <span className="inline-flex items-center gap-1 bg-orange-500/12 border border-orange-500/25 text-orange-300 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                    <Flame size={10} weight="fill" /> {streak}-day streak
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-[400px]">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                <Input
                  id="venture-search"
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
                        <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                          {r.logo_url ? <img src={r.logo_url} alt="" className="w-full h-full object-cover" /> : <Rocket size={18} className="text-purple-300" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] text-white font-semibold truncate">{r.name}</p>
                          <p className="text-[11px] text-white/45 truncate">{r.venture_number || r.stage} - {r.tagline || r.description || 'No description'}</p>
                        </div>
                        <ArrowUpRight size={13} className="text-white/30" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={() => router.push('/ventures/new')} className="hidden md:flex bg-white text-black hover:bg-white/90 text-[13px] font-semibold h-11 px-4 rounded-xl">
                <Plus size={14} weight="bold" className="mr-1.5" /> New venture
              </Button>
            </div>
          </div>

          <div className="hidden md:flex items-center border-b border-white/[0.06] mb-6">
            <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
              {TABS.map(tab => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={'px-4 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 flex items-center gap-1.5 ' +
                      (active ? 'text-white border-white' : 'text-white/45 border-transparent hover:text-white/85')}>
                    <Icon size={14} weight={active ? 'fill' : 'regular'} />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="md:hidden mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(() => {
                const t = TABS.find(t => t.id === activeTab)
                if (!t) return null
                const Icon = t.icon
                return <><Icon size={16} weight="fill" className="text-purple-400" /><h2 className="text-[15px] font-bold text-white">{t.label}</h2></>
              })()}
            </div>
            <Button size="sm" onClick={() => router.push('/ventures/new')} className="bg-white text-black hover:bg-white/90 text-[12px] font-semibold px-3 h-8 rounded-lg">
              <Plus size={12} className="mr-1" /> New
            </Button>
          </div>

          {activeTab === 'my-ventures' && (
            <>
              {smartInsight && (
                <div className="mb-5 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/10 border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <smartInsight.icon size={16} weight="fill" className={smartInsight.tint} />
                  </div>
                  <p className="text-[13px] text-white/80 flex-1">{smartInsight.text}</p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                <StatTile icon={<Rocket size={16} weight="fill" className="text-purple-300" />} value={stats.totalVentures} label="Ventures" />
                <StatTile icon={<Lightning size={16} weight="fill" className="text-emerald-300" />} value={stats.activeVentures} label="Active" live />
                <StatTile icon={<UsersThree size={16} weight="fill" className="text-cyan-300" />} value={stats.totalTeam} label="Team" />
                <StatTile icon={<Briefcase size={16} weight="fill" className="text-orange-300" />} value={stats.totalRoles} label="Open Roles" />
                <StatTile icon={<Heart size={16} weight="fill" className="text-rose-300" />} value={stats.totalFollowers} label="Followers" />
                <StatTile icon={<Bell size={16} weight="fill" className="text-purple-300" />} value={stats.totalApplications} label="Applications" highlight={stats.totalApplications > 0} />
              </div>

              <section className="mb-8">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <h2 className="text-[19px] font-bold text-white flex items-center gap-2">
                      Your ventures
                      {ventures.length > 0 && <span className="text-[12px] text-white/40 font-normal">- {ventures.length}</span>}
                    </h2>
                    <p className="text-[12.5px] text-white/45 mt-0.5">Pick up where you left off</p>
                  </div>
                  {ventures.length > 0 && (
                    <div className="flex items-center gap-1">
                      {ventures.length > 3 && !showAllVentures && (
                        <>
                          <button onClick={() => scroll(scrollContainerRef, 'left')} className="hidden md:flex w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] items-center justify-center text-white/70">
                            <CaretLeft size={13} />
                          </button>
                          <button onClick={() => scroll(scrollContainerRef, 'right')} className="hidden md:flex w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] items-center justify-center text-white/70">
                            <CaretRight size={13} />
                          </button>
                        </>
                      )}
                      {ventures.length > 3 && (
                        <button onClick={() => setShowAllVentures(!showAllVentures)}
                          className="text-[12px] text-white/70 hover:text-white font-semibold flex items-center gap-1 px-3 h-8 rounded-lg hover:bg-white/[0.04]">
                          {showAllVentures ? 'Collapse' : 'View all'} <ArrowRight size={11} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {showAllVentures ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ventures.map(v => <VentureCard key={v.id} venture={v} onOpen={() => router.push('/ventures/' + v.slug)} />)}
                    <NewVentureCard onClick={() => router.push('/ventures/new')} />
                  </div>
                ) : (
                  <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 md:-mx-8 px-4 md:px-8 snap-x snap-mandatory">
                    {ventures.map(v => (
                      <div key={v.id} className="snap-start flex-shrink-0">
                        <VentureCard venture={v} onOpen={() => router.push('/ventures/' + v.slug)} />
                      </div>
                    ))}
                    <div className="snap-start flex-shrink-0">
                      <NewVentureCard onClick={() => router.push('/ventures/new')} />
                    </div>
                  </div>
                )}
              </section>

              <section className="mb-8">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <h2 className="text-[19px] font-bold text-white flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      Live activity
                      {feedRefreshing && <Refresh size={13} className="text-white/40 animate-spin" />}
                    </h2>
                    <p className="text-[12.5px] text-white/45 mt-0.5">
                      Everything happening across your ventures
                      {feed.length > 0 && <span className="text-white/30"> - {feed.length} recent events</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => fetchFeed(true)}
                    className="text-[12px] text-white/60 hover:text-white font-semibold flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] px-3 h-8 rounded-lg transition-colors"
                  >
                    <Refresh size={12} className={feedRefreshing ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                  {feedLoading ? (
                    <div className="p-4 space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Skeleton className="w-9 h-9 rounded-full bg-white/[0.04]" />
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-3.5 w-2/3 bg-white/[0.04]" />
                            <Skeleton className="h-2.5 w-1/3 bg-white/[0.04]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : feed.length === 0 ? (
                    <div className="py-14 text-center">
                      <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-white/[0.06] items-center justify-center mb-3">
                        <Sparkle size={22} weight="fill" className="text-purple-300/60" />
                      </div>
                      <p className="text-[13px] text-white/60 font-semibold">All quiet on the frontier</p>
                      <p className="text-[11.5px] text-white/40 mt-1 max-w-xs mx-auto">
                        As people follow, apply, connect, and engage - you will see it here in real time.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      {feed.map(ev => (
                        <VentureFeedRow key={ev.id} event={ev} ventures={ventures} onOpen={(slug) => router.push('/ventures/' + slug)} />
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="mb-8">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <h2 className="text-[19px] font-bold text-white">Venture analytics</h2>
                    <p className="text-[12.5px] text-white/45 mt-0.5">Performance across all your ventures</p>
                  </div>
                  <select value={analyticsDays} onChange={(e) => setAnalyticsDays(Number(e.target.value))}
                    className="text-[12px] text-white/80 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] rounded-lg px-3 py-2 outline-none focus:border-white/[0.2] cursor-pointer font-medium">
                    <option value={7} className="bg-[#12121a]">Last 7 days</option>
                    <option value={30} className="bg-[#12121a]">Last 30 days</option>
                    <option value={90} className="bg-[#12121a]">Last 90 days</option>
                  </select>
                </div>

                {analyticsData && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-5">
                    <MetricPill label="Views" value={analyticsData.summary?.totalViews || 0} change={12} />
                    <MetricPill label="Followers" value={analyticsData.summary?.totalFollowers || 0} change={8} />
                    <MetricPill label="Apps" value={analyticsData.summary?.totalApplications || 0} change={24} />
                    <MetricPill label="Saves" value={analyticsData.summary?.totalSaves || 0} change={5} />
                    <MetricPill label="Team" value={stats.totalTeam} change={0} />
                    <MetricPill label="Roles" value={stats.totalRoles} change={0} />
                    <MetricPill label="Health" value={Math.round(ventures.reduce((s, v) => s + v.health_score, 0) / Math.max(ventures.length, 1))} change={0} suffix="%" />
                    <MetricPill label="Complete" value={Math.round(ventures.reduce((s, v) => s + v.profile_completeness, 0) / Math.max(ventures.length, 1))} change={0} suffix="%" highlight />
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <ChartCard title="Views over time" subtitle={'Last ' + analyticsDays + ' days'}>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData?.viewsOverTime || []} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id="vViewsG" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }}
                            tickFormatter={(v) => { const d = new Date(v); return d.toLocaleDateString('en', { month: 'short' }) + ' ' + d.getDate() }}
                            axisLine={false} tickLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '12px', padding: '8px 12px' }}
                            labelStyle={{ color: '#a1a1aa', fontSize: '10px', textTransform: 'uppercase' }}
                            itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}
                            labelFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })} />
                          <Area type="monotone" dataKey="views" stroke="#a78bfa" strokeWidth={2} fill="url(#vViewsG)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartCard>

                  <ChartCard title="Traffic sources" subtitle="Where founders find you">
                    <DonutChart data={analyticsData?.trafficSources || []} />
                  </ChartCard>

                  <ChartCard title="Stage distribution" subtitle="Your venture portfolio">
                    <StageDonut ventures={ventures} />
                  </ChartCard>
                </div>
              </section>

              <div className="xl:hidden space-y-4 mt-8">
                <CocoVentureBanner onOpen={openAssistant} />
                <CreateVentureBanner onCreate={() => router.push('/ventures/new')} />
              </div>
            </>
          )}

          {activeTab === 'following' && (
            <div>
              <h2 className="text-[19px] font-bold text-white mb-4">Ventures you follow</h2>
              {followingVentures.length === 0 ? (
                <EmptyState icon={Heart} title="You haven't followed any ventures" subtitle="Follow ventures to see their updates in your feed." action={{ label: 'Explore ventures', onClick: () => setActiveTab('explore') }} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {followingVentures.map((v: any) => <VentureCard key={v.id} venture={v} onOpen={() => router.push('/ventures/' + v.slug)} />)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'explore' && <VentureExploreView />}

          {activeTab === 'coco' && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Robot size={22} weight="fill" className="text-purple-400" />
                <h2 className="text-[19px] font-bold text-white">COCO Assistant for Founders</h2>
                <span className="text-[10px] font-bold text-purple-100 bg-purple-500/40 px-2 py-0.5 rounded uppercase tracking-wider">BETA</span>
              </div>
              <div className="bg-gradient-to-br from-purple-500/[0.06] via-white/[0.02] to-transparent border border-white/[0.08] rounded-2xl p-10 text-center">
                <div className="inline-flex items-center gap-2 mb-4 bg-purple-500/10 border border-purple-500/25 rounded-full px-4 py-2">
                  <HandWaving size={16} weight="fill" className="text-purple-300" />
                  <span className="text-[14px] text-purple-100 font-semibold">Hi! I&apos;m COCO</span>
                </div>
                <p className="text-[15px] text-white/85 max-w-lg mx-auto leading-relaxed">
                  Your AI co-founder for pitching, planning, raising, and hiring. Full venture intelligence coming soon.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto mt-8">
                  {[
                    { icon: Target, title: 'Investor Readiness', desc: 'AI-scored pitch analysis' },
                    { icon: ChartLineUp, title: 'Growth Intelligence', desc: 'Market opportunity mapping' },
                    { icon: Brain, title: 'Strategic Coaching', desc: 'Founder guidance 24/7' },
                  ].map(f => {
                    const Icon = f.icon
                    return (
                      <div key={f.title} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-left">
                        <Icon size={20} weight="fill" className="text-purple-300 mb-2" />
                        <p className="text-[13px] font-semibold text-white">{f.title}</p>
                        <p className="text-[11px] text-white/50 mt-0.5">{f.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'resources' && <ResourcesView />}
          {activeTab === 'discussions' && <EmptyState icon={ChatsCircle} title="Discussions - coming soon" subtitle="Ask questions, share insights, and connect with other founders." />}
        </div>

        <aside className="w-[360px] flex-shrink-0 border-l border-white/[0.06] px-5 py-6 space-y-4 hidden xl:block sticky top-0 h-screen overflow-y-auto scrollbar-hide">
          <CocoVentureBanner onOpen={openAssistant} />
          <CreateVentureBanner onCreate={() => router.push('/ventures/new')} />
        </aside>
      </div>

      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 py-1.5 flex items-center justify-around">
        {MOBILE_PRIMARY_TABS.map(id => {
          const tab = TABS.find(t => t.id === id)
          if (!tab) return null
          const Icon = tab.icon
          const active = activeTab === id
          return (
            <button key={id} onClick={() => setActiveTab(id)} className={'flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg min-w-[56px] ' + (active ? 'text-white' : 'text-white/45')}>
              <Icon size={20} weight={active ? 'fill' : 'regular'} />
              <span className="text-[10px] font-semibold">{tab.mobileLabel}</span>
            </button>
          )
        })}
        <button onClick={() => setMoreSheetOpen(true)} className="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg text-white/45 hover:text-white/85 min-w-[56px]">
          <DotsThreeOutline size={20} />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </nav>

      {moreSheetOpen && (
        <>
          <div className="xl:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setMoreSheetOpen(false)} />
          <div className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f18] border-t border-white/[0.1] rounded-t-2xl p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-white">More</h3>
              <button onClick={() => setMoreSheetOpen(false)} className="text-white/50 hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MOBILE_MORE_TABS.map(id => {
                const tab = TABS.find(t => t.id === id)
                if (!tab) return null
                const Icon = tab.icon
                return (
                  <button key={id} onClick={() => { setActiveTab(id); setMoreSheetOpen(false) }} className={'flex items-center gap-3 p-3 rounded-xl ' + (activeTab === id ? 'bg-purple-500/10 border border-purple-500/20 text-purple-300' : 'bg-white/[0.03] border border-white/[0.06] text-zinc-300 hover:bg-white/[0.05]')}>
                    <Icon size={18} weight={activeTab === id ? 'fill' : 'regular'} />
                    <span className="text-[14px] font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatTile({ icon, value, label, live, highlight }: { icon: React.ReactNode; value: number; label: string; live?: boolean; highlight?: boolean }) {
  return (
    <div className={
      'relative rounded-2xl p-4 transition-all group ' +
      (highlight
        ? 'bg-purple-500/[0.06] border border-purple-500/25 hover:border-purple-500/40'
        : 'bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]')
    }>
      {live && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          Live
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">{icon}</div>
        <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-[28px] font-black leading-none text-white tracking-tight">{formatNumber(value)}</p>
    </div>
  )
}

function MetricPill({ label, value, change, suffix = '', highlight }: { label: string; value: number; change: number; suffix?: string; highlight?: boolean }) {
  const positive = change >= 0
  return (
    <div className={'bg-white/[0.03] border rounded-xl px-3 py-2.5 ' + (highlight ? 'border-purple-500/25 bg-purple-500/[0.05]' : 'border-white/[0.06]')}>
      <p className="text-[10.5px] font-semibold text-white/50 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[16px] font-bold text-white">{formatNumber(value)}{suffix}</p>
        {change !== 0 && (
          <div className={'flex items-center gap-0.5 text-[10.5px] font-semibold ' + (positive ? 'text-emerald-400' : 'text-red-400')}>
            {positive ? <TrendUp size={10} weight="bold" /> : <TrendDown size={10} weight="bold" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
      <div className="mb-3">
        <h3 className="text-[13.5px] font-bold text-white">{title}</h3>
        {subtitle && <p className="text-[11px] text-white/45 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

const PIE_COLORS = ['#a78bfa', '#22d3ee', '#34d399', '#fb923c', '#fb7185', '#facc15']

function DonutChart({ data }: { data: { name: string; value: number; percentage: number }[] }) {
  const hasData = data && data.some(d => d.value > 0)
  if (!hasData) {
    return (
      <div className="h-[200px] flex items-center justify-center">
        <div className="text-center">
          <Circle size={30} className="mx-auto mb-2 text-white/15" />
          <p className="text-[12px] text-white/40">No data yet</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-4">
      <div className="w-[130px] h-[130px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" stroke="none">
              {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-1.5 min-w-0">
        {data.map((s: any, i: number) => (
          <div key={s.name} className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
              <span className="text-white/60 truncate">{s.name}</span>
            </div>
            <span className="text-white font-bold">{s.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StageDonut({ ventures }: { ventures: Venture[] }) {
  const stageCounts: Record<string, number> = {}
  ventures.forEach(v => {
    const s = v.stage || 'idea'
    stageCounts[s] = (stageCounts[s] || 0) + 1
  })
  const total = ventures.length
  const data = Object.entries(stageCounts).map(([name, value]) => ({
    name: name.toUpperCase(),
    value,
    percentage: total > 0 ? Math.round((value / total) * 100) : 0
  }))
  return <DonutChart data={data} />
}

function VentureFeedRow({ event, ventures, onOpen }: { event: VentureActivity; ventures: Venture[]; onOpen: (slug: string) => void }) {
  const venture = ventures.find(v => v.id === event.venture_id)
  return (
    <div className="group flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer"
      onClick={() => venture && onOpen(venture.slug)}>
      <div className="flex-shrink-0 relative">
        <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          {getActivityIcon(event.type)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] text-white leading-snug">{event.title}</p>
        {event.subtitle && <p className="text-[12px] text-white/50 mt-0.5 truncate">{event.subtitle}</p>}
        <div className="flex items-center gap-2 mt-1 text-[11px] text-white/40">
          <span>{timeAgo(event.created_at)}</span>
          {venture && (
            <>
              <span>-</span>
              <span className="text-white/60 font-medium truncate">{venture.name}</span>
              {venture.venture_number && <span className="text-white/25 font-mono truncate">{venture.venture_number}</span>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function VentureCard({ venture, onOpen }: { venture: any; onOpen: () => void }) {
  const stage = STAGE_STYLES[venture.stage || 'idea'] || STAGE_STYLES.idea
  const seekingChips = [
    venture.is_hiring && { label: 'Hiring', color: 'text-emerald-300 bg-emerald-500/10' },
    venture.seeking_investment && { label: 'Raising', color: 'text-blue-300 bg-blue-500/10' },
    venture.seeking_cofounder && { label: 'Co-founder', color: 'text-purple-300 bg-purple-500/10' },
  ].filter(Boolean) as { label: string; color: string }[]

  return (
    <div className="group w-[300px] flex-shrink-0 bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.15] hover:bg-white/[0.03] transition-all cursor-pointer" onClick={onOpen}>
      <div className="relative h-[130px] overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/10">
        {venture.cover_url || venture.logo_url ? (
          <img src={venture.cover_url || venture.logo_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Rocket size={40} className="text-purple-400/60" weight="duotone" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className={'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ' + stage.bg + ' ' + stage.text}>
            <span className={'w-1 h-1 rounded-full ' + stage.dot} />
            {STAGE_LABELS[venture.stage || 'idea'] || (venture.stage || 'IDEA').toUpperCase()}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-[15px] font-bold text-white truncate leading-tight">{venture.name}</h3>
        {venture.venture_number && <p className="text-[10.5px] text-white/40 font-mono mb-2">{venture.venture_number}</p>}
        <p className="text-[13px] text-white/65 line-clamp-2 mb-3 leading-relaxed min-h-[36px]">
          {venture.tagline || venture.description || 'No description'}
        </p>

        {seekingChips.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {seekingChips.map(c => (
              <span key={c.label} className={'text-[9.5px] font-semibold px-1.5 py-0.5 rounded ' + c.color}>{c.label}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 text-[11.5px] text-white/50 mb-3">
          <span className="flex items-center gap-1"><Users size={11} weight="fill" /> {venture.team_count || 0}</span>
          <span className="flex items-center gap-1"><Heart size={11} weight="fill" /> {formatNumber(venture.follower_count || 0)}</span>
          <span className="flex items-center gap-1"><Eye size={11} weight="fill" /> {formatNumber(venture.view_count || 0)}</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <span className="text-[11px] text-white/45">Updated {timeAgo(venture.last_activity_at || venture.updated_at)}</span>
          <button onClick={(e) => { e.stopPropagation(); onOpen() }} className="flex items-center gap-1 text-[11.5px] font-semibold text-white bg-white/[0.06] group-hover:bg-white group-hover:text-black px-2.5 h-7 rounded-md transition-colors">
            Open <ArrowRight size={11} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  )
}

function NewVentureCard({ onClick }: { onClick: () => void }) {
  return (
    <div onClick={onClick} className="w-[300px] flex-shrink-0 min-h-[300px] bg-gradient-to-br from-purple-500/[0.05] to-transparent border-2 border-dashed border-white/[0.1] rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-purple-400/40 hover:bg-purple-500/[0.08] transition-all group">
      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 flex items-center justify-center transition-all">
        <Plus size={28} weight="bold" className="text-purple-300 group-hover:text-purple-200" />
      </div>
      <p className="text-[15px] font-bold text-white">Launch a new venture</p>
      <p className="text-[12px] text-white/45 text-center px-8">Turn your next big idea into a company</p>
    </div>
  )
}

function EmptyState({ icon: Icon, title, subtitle, action }: { icon: any; title: string; subtitle: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl py-16 text-center">
      <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-white/[0.06] items-center justify-center mb-4">
        <Icon size={26} className="text-white/40" />
      </div>
      <p className="text-[15px] font-semibold text-white">{title}</p>
      <p className="text-[12.5px] text-white/45 mt-1 max-w-sm mx-auto">{subtitle}</p>
      {action && (
        <button onClick={action.onClick} className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold bg-white text-black hover:bg-white/90 px-4 h-9 rounded-lg">
          {action.label} <ArrowRight size={12} weight="bold" />
        </button>
      )}
    </div>
  )
}

function VentureExploreView() {
  const [ventures, setVentures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const router = useRouter()

  const categories = ['All', 'AgriTech', 'AI / Machine Learning', 'CleanTech', 'E-Commerce', 'EdTech', 'FinTech', 'HealthTech', 'Robotics', 'SaaS']

  useEffect(() => {
    fetch('/api/ventures/search?limit=30')
      .then(r => r.json())
      .then(d => { setVentures(d.ventures || []); setLoading(false) })
  }, [])

  return (
    <div>
      <div className="flex items-center gap-2 mb-5 overflow-x-auto scrollbar-hide -mx-4 md:-mx-8 px-4 md:px-8 pb-1">
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={'text-[12.5px] font-semibold whitespace-nowrap px-3.5 h-8 rounded-full transition-colors ' +
              (category === c ? 'bg-white text-black' : 'bg-white/[0.04] border border-white/[0.08] text-white/70 hover:bg-white/[0.08]')}>
            {c}
          </button>
        ))}
      </div>

      {ventures.length > 0 && ventures[0] && (
        <div onClick={() => router.push('/ventures/' + ventures[0].slug)}
          className="relative w-full h-[180px] rounded-2xl overflow-hidden mb-6 cursor-pointer group border border-white/[0.08]">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-blue-500/20" />
          {ventures[0].logo_url && (
            <img src={ventures[0].logo_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 p-5 flex flex-col justify-between">
            <div className="inline-flex items-center gap-1.5 bg-purple-500/20 backdrop-blur-md border border-purple-400/30 rounded-full px-2.5 py-1 self-start">
              <Fire size={11} weight="fill" className="text-orange-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-100">Trending</span>
            </div>
            <div>
              <h3 className="text-[22px] font-bold text-white leading-tight">{ventures[0].name}</h3>
              <p className="text-[12.5px] text-white/70 mt-1 max-w-lg line-clamp-1">{ventures[0].tagline}</p>
              <button className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold bg-white text-black hover:bg-white/90 px-3.5 h-8 rounded-lg">
                View Venture <ArrowRight size={11} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[17px] font-bold text-white flex items-center gap-2">
          <Sparkle size={16} weight="fill" className="text-purple-300" />
          Recommended for you
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[300px] bg-white/[0.03] rounded-2xl" />)}
        </div>
      ) : ventures.length === 0 ? (
        <EmptyState icon={Compass} title="Nothing here yet" subtitle="Try a different industry or reset filters." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ventures.map(v => <VentureCard key={v.id} venture={v} onOpen={() => router.push('/ventures/' + v.slug)} />)}
        </div>
      )}
    </div>
  )
}

function ResourcesView() {
  const resources = [
    { title: 'YC Application Guide 2026', category: 'Fundraising', readTime: '12 min', tint: 'text-orange-300 bg-orange-500/10' },
    { title: 'How to Write a Killer Problem Statement', category: 'Storytelling', readTime: '5 min', tint: 'text-purple-300 bg-purple-500/10' },
    { title: 'The Founders Guide to Building in Public', category: 'Growth', readTime: '10 min', tint: 'text-green-300 bg-green-500/10' },
    { title: 'Startup Metrics That Investors Actually Care About', category: 'Traction', readTime: '8 min', tint: 'text-blue-300 bg-blue-500/10' },
    { title: 'From 0 to 100 Customers: A Playbook', category: 'Sales', readTime: '15 min', tint: 'text-cyan-300 bg-cyan-500/10' },
    { title: 'Founder Equity: Splits, Vesting and Cap Tables', category: 'Legal', readTime: '10 min', tint: 'text-pink-300 bg-pink-500/10' },
  ]
  return (
    <div>
      <h2 className="text-[19px] font-bold text-white mb-4 flex items-center gap-2">
        <BookOpen size={18} weight="fill" className="text-purple-300" />
        Founder Resources
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map(r => (
          <div key={r.title} className="bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.15] rounded-2xl p-5 cursor-pointer transition-all group">
            <span className={'inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ' + r.tint}>{r.category}</span>
            <h3 className="text-[14.5px] font-bold text-white mt-3 leading-tight group-hover:text-purple-200 transition-colors">{r.title}</h3>
            <p className="text-[11.5px] text-white/40 mt-2">{r.readTime} read</p>
          </div>
        ))}
      </div>
    </div>
  )
}