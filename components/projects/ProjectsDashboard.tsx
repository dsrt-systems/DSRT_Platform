'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  MagnifyingGlass, Plus, FolderSimple, Lightning, Heart, Users,
  Briefcase, UserPlus, BookmarkSimple, CaretRight, CaretLeft,
  Command, ArrowRight, PencilSimpleLine, Rocket, Star, Globe,
  Archive, Robot, ListChecks, UsersThree, TrendUp, TrendDown,
  Browsers, ArrowsClockwise, Compass, PaintBrushBroad, BookOpen,
  ChatsCircle, DotsThreeOutline, X, Sparkle, Crown, CheckCircle,
  HandWaving, Brain, Code, Wrench, Network, Fire, ChartBar,
  Eye, ChatCircle, ShareNetwork, Flame, Trophy,
  Bell, ArrowUpRight, Clock, Circle, Lightbulb, ArrowsClockwise as Refresh
} from '@phosphor-icons/react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { ExploreView } from '@/components/explore/ExploreView'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface Project {
  id: string; slug: string; name: string; description: string | null
  tagline: string | null; icon: string; color: string; stage: string
  status: string; visibility: string; is_public: boolean
  project_number: string; cover_image_url: string | null
  founder_id: string | null; user_id: string | null
  team_size: number; open_roles: number; view_count: number
  follower_count: number; traction_score: number
  last_activity_at: string; updated_at: string; created_at: string
  category: string[]; tech_stack: string[]; sector: string | null
  project_members?: { id: string; user_id: string; role: string }[]
  project_roles?: { id: string; user_id: string; role: string }[]
}

interface FeedEvent {
  id: string
  type: string
  title: string
  subtitle: string | null
  created_at: string
  icon_type: string
  actor: { id: string; full_name: string | null; username: string | null; avatar_url: string | null } | null
  project: { id: string; name: string; slug: string; icon: string; color: string; project_number: string } | null
  entity_url: string | null
  entity_label: string | null
  metadata?: any
}

interface AnalyticMetric { value: number; change: number }
interface Analytics {
  views: AnalyticMetric; unique_views: AnalyticMetric; followers: AnalyticMetric
  applications: AnalyticMetric; profile_ctr: AnalyticMetric; saves: AnalyticMetric
  shares: AnalyticMetric; messages: AnalyticMetric; overall_growth: AnalyticMetric
  total_projects: number; active_projects: number; total_team_members: number
  total_followers: number; total_applications: number
}

interface DashboardData {
  projects: Project[]; drafts: Project[]; activity: any[]
  analytics: Analytics
  viewsOverTime: { date: string; views: number; unique_views: number }[]
  trafficSources: { name: string; value: number; percentage: number }[]
  audienceBreakdown: { name: string; value: number; percentage: number }[]
  following: Project[]
  stats: { totalProjects: number; activeProjects: number; totalFollowers: number; totalApplications: number; totalTeamMembers: number; totalRecruiting: number }
}

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
const TABS = [
  { id: 'my-projects', label: 'My Projects', icon: FolderSimple, mobileLabel: 'Projects' },
  { id: 'explore', label: 'Explore', icon: Compass, mobileLabel: 'Explore' },
  { id: 'following', label: 'Following', icon: Heart, mobileLabel: 'Following' },
  { id: 'wip', label: 'COCO Assistant', icon: Robot, mobileLabel: 'COCO' },
  { id: 'studio', label: 'Studio', icon: PaintBrushBroad, mobileLabel: 'Studio' },
  { id: 'archived', label: 'Archived', icon: Archive, mobileLabel: 'Archived' },
  { id: 'resources', label: 'Resources', icon: BookOpen, mobileLabel: 'Resources' },
  { id: 'discussions', label: 'Discussions', icon: ChatsCircle, mobileLabel: 'Discuss' },
] as const

type TabId = typeof TABS[number]['id']
const MOBILE_PRIMARY_TABS: TabId[] = ['my-projects', 'explore', 'following', 'wip']
const MOBILE_MORE_TABS: TabId[] = ['studio', 'archived', 'resources', 'discussions']

const STAGE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  idea:       { bg: 'bg-purple-500/12',  text: 'text-purple-200',  dot: 'bg-purple-400' },
  planning:   { bg: 'bg-blue-500/12',    text: 'text-blue-200',    dot: 'bg-blue-400' },
  building:   { bg: 'bg-cyan-500/12',    text: 'text-cyan-200',    dot: 'bg-cyan-400' },
  prototype:  { bg: 'bg-orange-500/12',  text: 'text-orange-200',  dot: 'bg-orange-400' },
  alpha:      { bg: 'bg-emerald-500/12', text: 'text-emerald-200', dot: 'bg-emerald-400' },
  beta:       { bg: 'bg-yellow-500/12',  text: 'text-yellow-200',  dot: 'bg-yellow-400' },
  mvp:        { bg: 'bg-green-500/12',   text: 'text-green-200',   dot: 'bg-green-400' },
  launched:   { bg: 'bg-red-500/12',     text: 'text-red-200',     dot: 'bg-red-400' },
  scaling:    { bg: 'bg-pink-500/12',    text: 'text-pink-200',    dot: 'bg-pink-400' },
  research:   { bg: 'bg-indigo-500/12',  text: 'text-indigo-200',  dot: 'bg-indigo-400' },
  production: { bg: 'bg-emerald-500/12', text: 'text-emerald-200', dot: 'bg-emerald-400' },
  completed:  { bg: 'bg-white/[0.08]',   text: 'text-white/70',    dot: 'bg-white/60' },
  'on-hold':  { bg: 'bg-zinc-500/12',    text: 'text-zinc-300',    dot: 'bg-zinc-400' },
}

const STAGE_LABELS: Record<string, string> = {
  idea: 'IDEA', planning: 'PLANNING', building: 'BUILDING', prototype: 'PROTOTYPE',
  alpha: 'ALPHA', beta: 'BETA', mvp: 'MVP', launched: 'LAUNCHED', scaling: 'SCALING',
  research: 'RESEARCH', production: 'PRODUCTION', completed: 'COMPLETED', 'on-hold': 'ON HOLD',
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
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
  if (!fullName) return 'Builder'
  return fullName.split(' ')[0]
}

function getActivityIcon(type: string) {
  const map: Record<string, React.ReactNode> = {
    new_follower: <Heart weight="fill" className="text-rose-400" />,
    member_joined: <UserPlus weight="fill" className="text-emerald-400" />,
    project_saved: <BookmarkSimple weight="fill" className="text-amber-400" />,
    task_created: <ListChecks weight="fill" className="text-blue-400" />,
    task_status_changed: <ArrowsClockwise weight="fill" className="text-cyan-400" />,
    application: <Briefcase weight="fill" className="text-purple-400" />,
    role_application: <Briefcase weight="fill" className="text-purple-400" />,
    stage_change: <Rocket weight="fill" className="text-orange-400" />,
    featured: <Star weight="fill" className="text-yellow-400" />,
    update_published: <PencilSimpleLine weight="fill" className="text-blue-400" />,
    collaboration_request: <UsersThree weight="fill" className="text-emerald-400" />,
    comment: <ChatCircle weight="fill" className="text-cyan-400" />,
  }
  return map[type] || <Sparkle weight="fill" className="text-white/50" />
}

// ═══════════════════════════════════════════════════════════════
// COCO BANNER
// ═══════════════════════════════════════════════════════════════
function CocoAssistantBanner({ onOpen, onOpenPro }: { onOpen: () => void; onOpenPro?: () => void }) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl bg-[#0d0620]"
      style={{ aspectRatio: '340 / 480' }}
    >
      <Image src="/banners/coco-bg.png" alt="" fill className="object-cover pointer-events-none select-none" priority sizes="340px" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#1a0b3d] via-[#2d0e5c] to-[#0a0420]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

      <div className="absolute inset-0 p-4 flex flex-col text-white">
        <div className="flex items-start justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-purple-400/25 rounded-full pl-1.5 pr-2 py-[3px]">
            <Sparkle weight="fill" className="text-purple-200" style={{ width: 10, height: 10 }} />
            <span className="text-[10px] font-semibold">DSRT COCO</span>
            <span className="text-[8px] font-bold bg-purple-500 text-white px-1 rounded">BETA</span>
          </div>
          <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-md px-2 py-0.5 text-right">
            <p className="text-[7.5px] text-white/60 leading-tight">Powered by</p>
            <p className="text-[9px] font-bold leading-tight">DSRT AI 💜</p>
          </div>
        </div>

        <div className="mt-4 max-w-[62%]">
          <h3 className="text-[16px] font-bold leading-[1.15]">
            Meet <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">COCO</span>
          </h3>
          <p className="text-[15px] font-bold leading-[1.15] text-white/95">your AI teammate.</p>
          <p className="text-[10.5px] text-white/70 leading-snug mt-1.5">
            Plans, builds &amp; ships real systems. One cute pet, infinite power.
          </p>
        </div>

        <div className="mt-3.5 space-y-1.5 max-w-[62%]">
          {[
            { icon: Brain, text: 'Plans complex tasks', color: 'text-purple-300' },
            { icon: Wrench, text: 'Fixes any domain', color: 'text-cyan-300' },
            { icon: Code, text: 'Writes full systems', color: 'text-emerald-300' },
            { icon: Network, text: 'Orchestrates agents', color: 'text-pink-300' },
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
          <p className="text-[9.5px] text-white/60 mt-0.5 leading-snug">Billed per use · Automate business or ship production code</p>
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

function CreateProjectBanner({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/[0.08] shadow-xl" style={{ aspectRatio: '340 / 220' }}>
      <Image src="/banners/create-project-bg.png" alt="" fill className="object-cover pointer-events-none select-none" sizes="340px" />
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
            <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Build</span> something amazing.
          </h3>
          <p className="text-[10.5px] text-white/70 leading-snug mt-1.5">Create your project, find builders, ship to the world.</p>
        </div>
        <button
          onClick={onCreate}
          className="w-full bg-white/[0.08] backdrop-blur-md border border-white/25 hover:bg-white hover:text-black text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 py-2"
          style={{ fontSize: '12px' }}
        >
          <Plus size={12} weight="bold" />
          Create Project
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export function ProjectsDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const draftsScrollRef = useRef<HTMLDivElement>(null)

  const [activeTab, setActiveTab] = useState<TabId>('my-projects')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [analyticsDays, setAnalyticsDays] = useState(30)
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // ── Live activity feed state ──
  const [feed, setFeed] = useState<FeedEvent[]>([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [feedRefreshing, setFeedRefreshing] = useState(false)

  // ── HOOKS FIRST — before any early return ──
  const smartInsight = useMemo(() => {
    if (!data?.stats || !data?.analytics) return null
    const s = data.stats
    const a = data.analytics
    if ((s.totalProjects || 0) === 0) {
      return { icon: Rocket, tint: 'text-purple-300', text: 'Ready to ship your first project? Start with one bold idea.' }
    }
    if ((a.views?.change || 0) > 20) {
      return { icon: Fire, tint: 'text-orange-300', text: 'You are on fire — views up ' + Math.abs(a.views.change) + '% this period.' }
    }
    if ((s.totalApplications || 0) > 0) {
      return { icon: Bell, tint: 'text-cyan-300', text: 'You have ' + s.totalApplications + ' pending application' + (s.totalApplications !== 1 ? 's' : '') + '. Review them to grow your team.' }
    }
    if ((s.totalRecruiting || 0) > 0) {
      return { icon: UsersThree, tint: 'text-emerald-300', text: s.totalRecruiting + ' open role' + (s.totalRecruiting !== 1 ? 's are' : ' is') + ' live — share your project to attract builders.' }
    }
    return null
  }, [data])

  // ── EFFECTS ──
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, avatar_url, username, streak_days, execution_score')
          .eq('id', user.id)
          .maybeSingle()
        setCurrentUser(profile)
      }
    })
  }, [supabase])

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/projects/dashboard?days=' + analyticsDays)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
    } catch (err) { console.error('Dashboard fetch:', err) }
    finally { setLoading(false) }
  }, [analyticsDays])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  // Live activity feed — 30s poll
  const fetchFeed = useCallback(async (silent = false) => {
    if (!silent) setFeedLoading(true)
    else setFeedRefreshing(true)
    try {
      const res = await fetch('/api/projects/activity?limit=40', { cache: 'no-store' })
      if (res.ok) {
        const j = await res.json()
        setFeed(j.activity || [])
      }
    } catch (e) { console.error('Feed fetch:', e) }
    finally { setFeedLoading(false); setFeedRefreshing(false) }
  }, [])

  useEffect(() => {
    fetchFeed(false)
    const interval = setInterval(() => fetchFeed(true), 30000)
    return () => clearInterval(interval)
  }, [fetchFeed])

  // Search typeahead
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); setSearchOpen(false); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/projects/search?q=' + encodeURIComponent(searchQuery))
        const json = await res.json()
        setSearchResults(json.results || [])
        setSearchOpen(true)
      } catch { setSearchResults([]) }
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // ⌘K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('project-search')?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => {
    ref.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' })
  }

  const openAssistant = () => setActiveTab('wip')

  // ── EARLY RETURN AFTER ALL HOOKS ──
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

  const projects = data?.projects || []
  const drafts = data?.drafts || []
  const analytics = data?.analytics
  const stats = data?.stats
  const viewsData = data?.viewsOverTime || []
  const trafficData = data?.trafficSources || []
  const audienceData = data?.audienceBreakdown || []
  const streak = currentUser?.streak_days || 0

  return (
    <div className="flex-1 min-h-screen bg-[#0a0a0f] pb-20 xl:pb-0 text-white">
      <div className="flex flex-col xl:flex-row">
        <div className="flex-1 min-w-0 px-4 md:px-8 py-5 md:py-7 max-w-full xl:max-w-[calc(100%-380px)]">

          {/* HEADER */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[26px] md:text-[30px] font-bold tracking-tight leading-tight">
                {greeting()}, <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">{firstName(currentUser?.full_name)}</span>
              </h1>
              <p className="text-[13px] text-white/50 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Here is what is happening across your projects.</span>
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
                  id="project-search"
                  placeholder="Search projects, tech, keywords..."
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
                        onClick={() => { router.push('/projects/' + r.slug); setSearchOpen(false); setSearchQuery('') }}>
                        <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                          {r.cover_image_url ? <img src={r.cover_image_url} alt="" className="w-full h-full object-cover" /> : <span>{r.icon || '\u26A1'}</span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] text-white font-semibold truncate">{r.name}</p>
                          <p className="text-[11px] text-white/45 truncate">{r.project_number} · {r.tagline || r.description || 'No description'}</p>
                        </div>
                        <ArrowUpRight size={13} className="text-white/30" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={() => router.push('/projects/new')} className="hidden md:flex bg-white text-black hover:bg-white/90 text-[13px] font-semibold h-11 px-4 rounded-xl">
                <Plus size={14} weight="bold" className="mr-1.5" /> New project
              </Button>
            </div>
          </div>

          {/* TABS */}
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

          {/* Mobile active tab label */}
          <div className="md:hidden mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(() => {
                const t = TABS.find(t => t.id === activeTab)
                if (!t) return null
                const Icon = t.icon
                return <><Icon size={16} weight="fill" className="text-purple-400" /><h2 className="text-[15px] font-bold text-white">{t.label}</h2></>
              })()}
            </div>
            <Button size="sm" onClick={() => router.push('/projects/new')} className="bg-white text-black hover:bg-white/90 text-[12px] font-semibold px-3 h-8 rounded-lg">
              <Plus size={12} className="mr-1" /> New
            </Button>
          </div>

          {activeTab === 'my-projects' && (
            <>
              {/* SMART INSIGHT — only if there's real signal */}
              {smartInsight && (
                <div className="mb-5 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/10 border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <smartInsight.icon size={16} weight="fill" className={smartInsight.tint} />
                  </div>
                  <p className="text-[13px] text-white/80 flex-1">{smartInsight.text}</p>
                </div>
              )}

              {/* STATS — inventory only, no synthetic sparks */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                <StatTile icon={<FolderSimple size={16} weight="fill" className="text-blue-300" />} value={stats?.totalProjects || 0} label="Projects" />
                <StatTile icon={<Lightning size={16} weight="fill" className="text-emerald-300" />} value={stats?.activeProjects || 0} label="Active" live />
                <StatTile icon={<UsersThree size={16} weight="fill" className="text-cyan-300" />} value={stats?.totalTeamMembers || 0} label="Team" />
                <StatTile icon={<Briefcase size={16} weight="fill" className="text-orange-300" />} value={stats?.totalRecruiting || 0} label="Open Roles" />
                <StatTile icon={<Heart size={16} weight="fill" className="text-rose-300" />} value={stats?.totalFollowers || 0} label="Followers" />
                <StatTile icon={<UserPlus size={16} weight="fill" className="text-purple-300" />} value={stats?.totalApplications || 0} label="Applications" highlight={(stats?.totalApplications || 0) > 0} />
              </div>

              {/* CONTINUE BUILDING */}
              <section className="mb-8">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <h2 className="text-[19px] font-bold text-white flex items-center gap-2">
                      Continue building
                      {projects.length > 0 && <span className="text-[12px] text-white/40 font-normal">· {projects.length}</span>}
                    </h2>
                    <p className="text-[12.5px] text-white/45 mt-0.5">Pick up where you left off</p>
                  </div>
                  {projects.length > 0 && (
                    <div className="flex items-center gap-1">
                      {projects.length > 3 && !showAllProjects && (
                        <>
                          <button onClick={() => scroll(scrollContainerRef, 'left')} className="hidden md:flex w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] items-center justify-center text-white/70">
                            <CaretLeft size={13} />
                          </button>
                          <button onClick={() => scroll(scrollContainerRef, 'right')} className="hidden md:flex w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] items-center justify-center text-white/70">
                            <CaretRight size={13} />
                          </button>
                        </>
                      )}
                      {projects.length > 3 && (
                        <button onClick={() => setShowAllProjects(!showAllProjects)}
                          className="text-[12px] text-white/70 hover:text-white font-semibold flex items-center gap-1 px-3 h-8 rounded-lg hover:bg-white/[0.04]">
                          {showAllProjects ? 'Collapse' : 'View all'} <ArrowRight size={11} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {showAllProjects ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map(p => <ProjectCard key={p.id} project={p} onOpen={() => router.push('/projects/' + p.slug)} />)}
                    <NewProjectCard onClick={() => router.push('/projects/new')} />
                  </div>
                ) : (
                  <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 md:-mx-8 px-4 md:px-8 snap-x snap-mandatory">
                    {projects.map(p => (
                      <div key={p.id} className="snap-start flex-shrink-0">
                        <ProjectCard project={p} onOpen={() => router.push('/projects/' + p.slug)} />
                      </div>
                    ))}
                    <div className="snap-start flex-shrink-0">
                      <NewProjectCard onClick={() => router.push('/projects/new')} />
                    </div>
                  </div>
                )}
              </section>

              {/* FULL-WIDTH LIVE ACTIVITY FEED */}
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
                      Everything happening across your projects
                      {feed.length > 0 && <span className="text-white/30"> · {feed.length} recent events</span>}
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
                        As people follow, apply, comment, and join — you will see it here in real time.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      {feed.map(ev => (
                        <FeedRow key={ev.id} event={ev} onProjectClick={(slug) => router.push('/projects/' + slug)} onEntityClick={(url) => router.push(url)} />
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* ANALYTICS */}
              <section className="mb-8">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <h2 className="text-[19px] font-bold text-white">Project analytics</h2>
                    <p className="text-[12.5px] text-white/45 mt-0.5">Performance across all your projects</p>
                  </div>
                  <select value={analyticsDays} onChange={(e) => setAnalyticsDays(Number(e.target.value))}
                    className="text-[12px] text-white/80 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] rounded-lg px-3 py-2 outline-none focus:border-white/[0.2] cursor-pointer font-medium">
                    <option value={7} className="bg-[#12121a]">Last 7 days</option>
                    <option value={30} className="bg-[#12121a]">Last 30 days</option>
                    <option value={90} className="bg-[#12121a]">Last 90 days</option>
                  </select>
                </div>

                {analytics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-5">
                    <MetricPill label="Views" value={analytics.views?.value || 0} change={analytics.views?.change || 0} />
                    <MetricPill label="Unique" value={analytics.unique_views?.value || 0} change={analytics.unique_views?.change || 0} />
                    <MetricPill label="Followers" value={analytics.followers?.value || 0} change={analytics.followers?.change || 0} />
                    <MetricPill label="Applications" value={analytics.applications?.value || 0} change={analytics.applications?.change || 0} />
                    <MetricPill label="CTR" value={analytics.profile_ctr?.value || 0} change={analytics.profile_ctr?.change || 0} suffix="%" />
                    <MetricPill label="Saves" value={analytics.saves?.value || 0} change={analytics.saves?.change || 0} />
                    <MetricPill label="Shares" value={analytics.shares?.value || 0} change={analytics.shares?.change || 0} />
                    <MetricPill label="Growth" value={analytics.overall_growth?.value || 0} change={analytics.overall_growth?.change || 0} suffix="%" highlight />
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <ChartCard title="Views over time" subtitle={'Last ' + analyticsDays + ' days'}>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={viewsData} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id="viewsG" x1="0" y1="0" x2="0" y2="1">
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
                          <Area type="monotone" dataKey="views" stroke="#a78bfa" strokeWidth={2} fill="url(#viewsG)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartCard>

                  <ChartCard title="Traffic sources" subtitle="Where people find you">
                    <DonutChart data={trafficData} />
                  </ChartCard>

                  <ChartCard title="Audience" subtitle="Who is visiting">
                    <DonutChart data={audienceData} />
                  </ChartCard>
                </div>
              </section>

              {drafts.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <h2 className="text-[17px] font-bold text-white flex items-center gap-2">
                        Work in progress
                        <span className="text-[11px] text-white/40 font-normal bg-white/[0.05] border border-white/[0.06] px-2 py-0.5 rounded-full">Unpublished · {drafts.length}</span>
                      </h2>
                      <p className="text-[12px] text-white/45 mt-0.5">Drafts waiting for you to finish</p>
                    </div>
                  </div>
                  <div ref={draftsScrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 md:-mx-8 px-4 md:px-8">
                    {drafts.map(d => <DraftCard key={d.id} project={d} onClick={() => router.push('/projects/' + d.slug)} />)}
                  </div>
                </section>
              )}

              {/* Mobile-only sidebar banners */}
              <div className="xl:hidden space-y-4 mt-8">
                <CocoAssistantBanner onOpen={openAssistant} />
                <CreateProjectBanner onCreate={() => router.push('/projects/new')} />
              </div>
            </>
          )}

          {activeTab === 'following' && (
            <div>
              <h2 className="text-[19px] font-bold text-white mb-4">Projects you follow</h2>
              {(data?.following || []).length === 0 ? (
                <EmptyState icon={Heart} title="You haven't followed any projects" subtitle="Follow projects to see their updates in your feed." action={{ label: 'Explore projects', onClick: () => setActiveTab('explore') }} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(data?.following || []).map((p: any) => <ProjectCard key={p.id} project={p} onOpen={() => router.push('/projects/' + p.slug)} />)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'explore' && <ExploreView />}

          {activeTab === 'wip' && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Robot size={22} weight="fill" className="text-purple-400" />
                <h2 className="text-[19px] font-bold text-white">COCO Assistant</h2>
                <span className="text-[10px] font-bold text-purple-100 bg-purple-500/40 px-2 py-0.5 rounded uppercase tracking-wider">BETA</span>
              </div>
              <div className="bg-gradient-to-br from-purple-500/[0.06] via-white/[0.02] to-transparent border border-white/[0.08] rounded-2xl p-10 text-center">
                <div className="inline-flex items-center gap-2 mb-4 bg-purple-500/10 border border-purple-500/25 rounded-full px-4 py-2">
                  <HandWaving size={16} weight="fill" className="text-purple-300" />
                  <span className="text-[14px] text-purple-100 font-semibold">Hi! I&apos;m COCO 👋</span>
                </div>
                <p className="text-[15px] text-white/85 max-w-lg mx-auto leading-relaxed">Your AI co-pilot for building better projects. Full experience coming soon.</p>
                <p className="text-[12.5px] text-white/45 mt-2 max-w-lg mx-auto">For now, I live in the sidebar and I'm learning about your projects.</p>
              </div>
            </div>
          )}

          {activeTab === 'archived' && (
            <EmptyState icon={Archive} title="No archived projects" subtitle="Archive old projects to keep your workspace clean." />
          )}

          {['studio', 'resources', 'discussions'].includes(activeTab) && (
            <EmptyState icon={Browsers} title={TABS.find(t => t.id === activeTab)?.label + ' — coming soon'} subtitle="This section is being built right now." />
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="w-[360px] flex-shrink-0 border-l border-white/[0.06] px-5 py-6 space-y-4 hidden xl:block sticky top-0 h-screen overflow-y-auto scrollbar-hide">
          <CocoAssistantBanner onOpen={openAssistant} />
          <CreateProjectBanner onCreate={() => router.push('/projects/new')} />
        </aside>
      </div>

      {/* Mobile bottom nav */}
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

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// FEED ROW — X/Twitter style
// ═══════════════════════════════════════════════════════════════
function FeedRow({ event, onProjectClick, onEntityClick }: {
  event: FeedEvent
  onProjectClick: (slug: string) => void
  onEntityClick: (url: string) => void
}) {
  const handleMainClick = () => {
    if (event.project?.slug) onProjectClick(event.project.slug)
  }

  return (
    <div
      className="group flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer"
      onClick={handleMainClick}
    >
      {/* Icon or avatar */}
      <div className="flex-shrink-0 relative">
        {event.actor?.avatar_url ? (
          <div className="w-9 h-9 rounded-full overflow-hidden bg-white/[0.06] border border-white/[0.08]">
            <img src={event.actor.avatar_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            {getActivityIcon(event.icon_type)}
          </div>
        )}
        {event.actor?.avatar_url && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0a0a0f] border-2 border-[#0a0a0f] flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-white/[0.06] flex items-center justify-center">
              {getActivityIcon(event.icon_type)}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] text-white leading-snug">{event.title}</p>
        {event.subtitle && (
          <p className="text-[12px] text-white/50 mt-0.5 truncate">{event.subtitle}</p>
        )}
        <div className="flex items-center gap-2 mt-1 text-[11px] text-white/40">
          <span>{timeAgo(event.created_at)}</span>
          {event.project && (
            <>
              <span>·</span>
              <span className="text-white/60 font-medium truncate">{event.project.name}</span>
              <span className="text-white/25 font-mono truncate">{event.project.project_number}</span>
            </>
          )}
        </div>
      </div>

      {/* Entity action */}
      {event.entity_url && event.entity_url !== '#' && (
        <button
          onClick={(e) => { e.stopPropagation(); onEntityClick(event.entity_url!) }}
          className="flex-shrink-0 self-center text-[11px] font-semibold text-white/60 hover:text-white flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] rounded-lg px-2.5 h-7 opacity-0 group-hover:opacity-100 transition-all"
        >
          {event.entity_label || 'View'} <ArrowUpRight size={10} />
        </button>
      )}
    </div>
  )
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const teamCount = new Set([
    project.founder_id, project.user_id,
    ...(project.project_members || []).map(m => m.user_id),
    ...(project.project_roles || []).map(r => r.user_id),
  ].filter(Boolean)).size
  const stage = STAGE_STYLES[project.stage] || STAGE_STYLES.building
  const isActive = project.status === 'active'

  return (
    <div className="group w-[300px] flex-shrink-0 bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.15] hover:bg-white/[0.03] transition-all cursor-pointer" onClick={onOpen}>
      <div className="relative h-[130px] overflow-hidden">
        {project.cover_image_url ? (
          <img src={project.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/10 flex items-center justify-center">
            <span className="text-5xl opacity-70">{project.icon || '\u26A1'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className={'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ' + stage.bg + ' ' + stage.text}>
            <span className={'w-1 h-1 rounded-full ' + stage.dot} />
            {STAGE_LABELS[project.stage] || project.stage.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-[15px] font-bold text-white truncate leading-tight">{project.name}</h3>
        <p className="text-[10.5px] text-white/40 font-mono mb-2">{project.project_number}</p>
        <p className="text-[13px] text-white/65 line-clamp-2 mb-3 leading-relaxed min-h-[36px]">
          {project.tagline || project.description || 'No description'}
        </p>
        <div className="flex items-center gap-3 text-[11.5px] text-white/50 mb-3">
          <span className="flex items-center gap-1"><Users size={11} weight="fill" /> {teamCount}</span>
          <span className="flex items-center gap-1"><Heart size={11} weight="fill" /> {formatNumber(project.follower_count || 0)}</span>
          <span className="flex items-center gap-1"><Eye size={11} weight="fill" /> {formatNumber(project.view_count || 0)}</span>
          {project.open_roles > 0 && (
            <span className="flex items-center gap-1 text-orange-300 font-semibold ml-auto">
              <Lightning size={11} weight="fill" /> {project.open_roles} open
            </span>
          )}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <span className="text-[11px] text-white/45">Updated {timeAgo(project.last_activity_at || project.updated_at)}</span>
          <button onClick={(e) => { e.stopPropagation(); onOpen() }} className="flex items-center gap-1 text-[11.5px] font-semibold text-white bg-white/[0.06] group-hover:bg-white group-hover:text-black px-2.5 h-7 rounded-md transition-colors">
            Open <ArrowRight size={11} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  )
}

function NewProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <div onClick={onClick} className="w-[300px] flex-shrink-0 min-h-[300px] bg-gradient-to-br from-purple-500/[0.05] to-transparent border-2 border-dashed border-white/[0.1] rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-purple-400/40 hover:bg-purple-500/[0.08] transition-all group">
      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 flex items-center justify-center transition-all">
        <Plus size={28} weight="bold" className="text-purple-300 group-hover:text-purple-200" />
      </div>
      <p className="text-[15px] font-bold text-white">Start a new project</p>
      <p className="text-[12px] text-white/45 text-center px-8">Turn your next idea into reality</p>
    </div>
  )
}

function DraftCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <div onClick={onClick} className="w-[240px] flex-shrink-0 bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden hover:border-orange-500/25 hover:bg-white/[0.04] transition-all cursor-pointer group">
      <div className="relative h-[90px] overflow-hidden">
        {project.cover_image_url ? (
          <img src={project.cover_image_url} alt="" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 flex items-center justify-center">
            <span className="text-3xl opacity-40">{project.icon || '\u26A1'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute top-2 left-2 text-[9px] font-bold text-orange-300 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded uppercase tracking-wider">Draft</span>
      </div>
      <div className="p-3">
        <h4 className="text-[13px] font-bold text-white truncate mb-0.5">{project.name}</h4>
        <p className="text-[10px] text-white/40 font-mono mb-2">{project.project_number}</p>
        <p className="text-[10.5px] text-white/50 mb-2">Last edited {timeAgo(project.updated_at)}</p>
        <button className="w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-white bg-white/[0.06] group-hover:bg-white group-hover:text-black px-2.5 h-7 rounded-md transition-colors">
          Continue <ArrowRight size={10} weight="bold" />
        </button>
      </div>
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
