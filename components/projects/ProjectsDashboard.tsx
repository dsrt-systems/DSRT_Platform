'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  MagnifyingGlass, Plus, FolderSimple, Lightning, Heart, Users,
  Briefcase, UserPlus, BookmarkSimple, CaretRight, CaretLeft,
  Command, ArrowRight, PencilSimpleLine, Rocket, Star,
  ListChecks, UsersThree, TrendUp, TrendDown,
  ArrowsClockwise, Compass,
  DotsThreeOutline, X, Sparkle,
  Eye, ChatCircle, Flame, Fire,
  Bell, ArrowUpRight, Circle, ArrowsClockwise as Refresh
} from '@phosphor-icons/react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { ExploreView } from '@/components/explore/ExploreView'

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
  id: string; type: string; title: string; subtitle: string | null
  created_at: string; icon_type: string
  actor: { id: string; full_name: string | null; username: string | null; avatar_url: string | null } | null
  project: { id: string; name: string; slug: string; icon: string; color: string; project_number: string } | null
  entity_url: string | null; entity_label: string | null; metadata?: any
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

const TABS = [
  { id: 'my-projects', label: 'My Projects', icon: FolderSimple, mobileLabel: 'Projects' },
  { id: 'explore', label: 'Explore', icon: Compass, mobileLabel: 'Explore' },
  { id: 'following', label: 'Following', icon: Heart, mobileLabel: 'Following' },
  { id: 'applications', label: 'Applications', icon: Briefcase, mobileLabel: 'Apps' },
] as const

type TabId = typeof TABS[number]['id']
const MOBILE_PRIMARY_TABS: TabId[] = ['my-projects', 'explore', 'following', 'applications']

const STAGE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  idea: { bg: 'bg-purple-500/12', text: 'text-purple-200', dot: 'bg-purple-400' },
  planning: { bg: 'bg-blue-500/12', text: 'text-blue-200', dot: 'bg-blue-400' },
  building: { bg: 'bg-cyan-500/12', text: 'text-cyan-200', dot: 'bg-cyan-400' },
  prototype: { bg: 'bg-orange-500/12', text: 'text-orange-200', dot: 'bg-orange-400' },
  alpha: { bg: 'bg-emerald-500/12', text: 'text-emerald-200', dot: 'bg-emerald-400' },
  beta: { bg: 'bg-yellow-500/12', text: 'text-yellow-200', dot: 'bg-yellow-400' },
  mvp: { bg: 'bg-green-500/12', text: 'text-green-200', dot: 'bg-green-400' },
  launched: { bg: 'bg-red-500/12', text: 'text-red-200', dot: 'bg-red-400' },
  scaling: { bg: 'bg-pink-500/12', text: 'text-pink-200', dot: 'bg-pink-400' },
  research: { bg: 'bg-indigo-500/12', text: 'text-indigo-200', dot: 'bg-indigo-400' },
  production: { bg: 'bg-emerald-500/12', text: 'text-emerald-200', dot: 'bg-emerald-400' },
  completed: { bg: 'bg-white/[0.08]', text: 'text-white/70', dot: 'bg-white/60' },
  'on-hold': { bg: 'bg-zinc-500/12', text: 'text-zinc-300', dot: 'bg-zinc-400' },
}

const STAGE_LABELS: Record<string, string> = {
  idea: 'IDEA', planning: 'PLANNING', building: 'BUILDING', prototype: 'PROTOTYPE',
  alpha: 'ALPHA', beta: 'BETA', mvp: 'MVP', launched: 'LAUNCHED', scaling: 'SCALING',
  research: 'RESEARCH', production: 'PRODUCTION', completed: 'COMPLETED', 'on-hold': 'ON HOLD',
}

function timeAgo(dateStr: string | undefined | null): string {
  if (!dateStr) return ''
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
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [feed, setFeed] = useState<FeedEvent[]>([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [feedRefreshing, setFeedRefreshing] = useState(false)

  const smartInsight = useMemo(() => {
    if (!data?.stats || !data?.analytics) return null
    const s = data.stats
    const a = data.analytics
    if ((s.totalProjects || 0) === 0) return { icon: Rocket, tint: 'text-purple-300', text: 'Ready to ship your first project? Start with one bold idea.' }
    if ((a.views?.change || 0) > 20) return { icon: Fire, tint: 'text-orange-300', text: 'Views up ' + Math.abs(a.views.change) + '% this period.' }
    if ((s.totalApplications || 0) > 0) return { icon: Bell, tint: 'text-cyan-300', text: s.totalApplications + ' pending application' + (s.totalApplications !== 1 ? 's' : '') + '.' }
    if ((s.totalRecruiting || 0) > 0) return { icon: UsersThree, tint: 'text-emerald-300', text: s.totalRecruiting + ' open role' + (s.totalRecruiting !== 1 ? 's' : '') + ' live.' }
    return null
  }, [data])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile } = await supabase.from('users').select('full_name, avatar_url, username, streak_days').eq('id', user.id).maybeSingle()
        setCurrentUser(profile)
      }
    })
  }, [supabase])

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/projects/dashboard?days=' + analyticsDays)
      if (!res.ok) throw new Error('Failed')
      setData(await res.json())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [analyticsDays])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const fetchFeed = useCallback(async (silent = false) => {
    if (!silent) setFeedLoading(true); else setFeedRefreshing(true)
    try {
      const res = await fetch('/api/projects/activity?limit=40', { cache: 'no-store' })
      if (res.ok) setFeed((await res.json()).activity || [])
    } catch (e) { console.error(e) }
    finally { setFeedLoading(false); setFeedRefreshing(false) }
  }, [])

  useEffect(() => {
    fetchFeed(false)
    const interval = setInterval(() => fetchFeed(true), 30000)
    return () => clearInterval(interval)
  }, [fetchFeed])

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); setSearchOpen(false); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/projects/search?q=' + encodeURIComponent(searchQuery))
        setSearchResults((await res.json()).results || [])
        setSearchOpen(true)
      } catch { setSearchResults([]) }
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); document.getElementById('project-search')?.focus() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => {
    ref.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-[#0a0a0f] pb-20">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
          <Skeleton className="h-10 w-72 bg-white/5 mb-3" />
          <Skeleton className="h-5 w-96 bg-white/5 mb-6" />
          <div className="grid grid-cols-3 gap-3 mb-8">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[300px] bg-white/5 rounded-2xl" />)}
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
      <div className="px-4 md:px-8 py-5 md:py-7 max-w-[1400px] mx-auto">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[26px] md:text-[30px] font-bold tracking-tight leading-tight">
              {greeting()}, <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">{firstName(currentUser?.full_name)}</span>
            </h1>
            <p className="text-[13px] text-white/50 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Here is what is happening across your projects.</span>
              {streak > 0 && <span className="inline-flex items-center gap-1 bg-orange-500/12 border border-orange-500/25 text-orange-300 rounded-full px-2 py-0.5 text-[11px] font-semibold"><Flame size={10} weight="fill" /> {streak}-day streak</span>}
            </p>
          </div>
          <Button onClick={() => router.push('/projects/new')} className="hidden md:flex bg-white text-black hover:bg-white/90 text-[13px] font-semibold h-11 px-4 rounded-xl">
            <Plus size={14} weight="bold" className="mr-1.5" /> New project
          </Button>
        </div>

        <div className="hidden md:flex items-center border-b border-white/[0.06] mb-6">
          <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
            {TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={'px-4 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 flex items-center gap-1.5 ' + (active ? 'text-white border-white' : 'text-white/45 border-transparent hover:text-white/85')}>
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
          <Button size="sm" onClick={() => router.push('/projects/new')} className="bg-white text-black hover:bg-white/90 text-[12px] font-semibold px-3 h-8 rounded-lg">
            <Plus size={12} className="mr-1" /> New
          </Button>
        </div>

        {activeTab === 'my-projects' && (
          <>
            {smartInsight && (
              <div className="mb-5 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/10 border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <smartInsight.icon size={16} weight="fill" className={smartInsight.tint} />
                </div>
                <p className="text-[13px] text-white/80 flex-1">{smartInsight.text}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-6 text-[13px] text-white/70">
              <span className="flex items-center gap-1.5 font-semibold text-white"><FolderSimple size={13} weight="fill" className="text-white/60" /> {stats?.totalProjects || 0} project{(stats?.totalProjects || 0) !== 1 ? 's' : ''}</span>
              <span className="text-white/25">·</span>
              <span className="flex items-center gap-1"><Lightning size={12} weight="fill" className="text-emerald-400" /> {stats?.activeProjects || 0} active</span>
              <span className="text-white/25">·</span>
              <span className="flex items-center gap-1"><Users size={12} weight="fill" className="text-white/50" /> {stats?.totalTeamMembers || 0} team</span>
              <span className="text-white/25">·</span>
              <span className="flex items-center gap-1"><Heart size={12} weight="fill" className="text-rose-400/80" /> {formatNumber(stats?.totalFollowers || 0)} followers</span>
              {(stats?.totalRecruiting || 0) > 0 && <><span className="text-white/25">·</span><span className="flex items-center gap-1 text-orange-300"><Briefcase size={12} weight="fill" /> {stats?.totalRecruiting} open roles</span></>}
              {(stats?.totalApplications || 0) > 0 && <><span className="text-white/25">·</span><span className="flex items-center gap-1 text-purple-300 font-semibold">{stats?.totalApplications} pending</span></>}
            </div>

            <section className="mb-8">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h2 className="text-[19px] font-bold text-white flex items-center gap-2">Continue building {projects.length > 0 && <span className="text-[12px] text-white/40 font-normal">· {projects.length}</span>}</h2>
                  <p className="text-[12.5px] text-white/45 mt-0.5">Pick up where you left off</p>
                </div>
                {projects.length > 3 && (
                  <div className="flex items-center gap-1">
                    {!showAllProjects && <>
                      <button onClick={() => scroll(scrollContainerRef, 'left')} className="hidden md:flex w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] items-center justify-center text-white/70"><CaretLeft size={13} /></button>
                      <button onClick={() => scroll(scrollContainerRef, 'right')} className="hidden md:flex w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] items-center justify-center text-white/70"><CaretRight size={13} /></button>
                    </>}
                    <button onClick={() => setShowAllProjects(!showAllProjects)} className="text-[12px] text-white/70 hover:text-white font-semibold flex items-center gap-1 px-3 h-8 rounded-lg hover:bg-white/[0.04]">{showAllProjects ? 'Collapse' : 'View all'} <ArrowRight size={11} /></button>
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
                  {projects.map(p => <div key={p.id} className="snap-start flex-shrink-0"><ProjectCard project={p} onOpen={() => router.push('/projects/' + p.slug)} /></div>)}
                  <div className="snap-start flex-shrink-0"><NewProjectCard onClick={() => router.push('/projects/new')} /></div>
                </div>
              )}
            </section>

            <section className="mb-8">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h2 className="text-[19px] font-bold text-white flex items-center gap-2">
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
                    Live activity {feedRefreshing && <Refresh size={13} className="text-white/40 animate-spin" />}
                  </h2>
                  <p className="text-[12.5px] text-white/45 mt-0.5">Everything happening across your projects {feed.length > 0 && <span className="text-white/30">· {feed.length} events</span>}</p>
                </div>
                <button onClick={() => fetchFeed(true)} className="text-[12px] text-white/60 hover:text-white font-semibold flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] px-3 h-8 rounded-lg"><Refresh size={12} className={feedRefreshing ? 'animate-spin' : ''} /> Refresh</button>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                {feedLoading ? (
                  <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="flex items-start gap-3"><Skeleton className="w-9 h-9 rounded-full bg-white/[0.04]" /><div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-2/3 bg-white/[0.04]" /><Skeleton className="h-2.5 w-1/3 bg-white/[0.04]" /></div></div>)}</div>
                ) : feed.length === 0 ? (
                  <div className="py-14 text-center">
                    <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-white/[0.06] items-center justify-center mb-3"><Sparkle size={22} weight="fill" className="text-purple-300/60" /></div>
                    <p className="text-[13px] text-white/60 font-semibold">All quiet on the frontier</p>
                    <p className="text-[11.5px] text-white/40 mt-1 max-w-xs mx-auto">As people follow, apply, comment, and join — you will see it here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">{feed.map(ev => <FeedRow key={ev.id} event={ev} onProjectClick={(slug) => router.push('/projects/' + slug)} onEntityClick={(url) => router.push(url)} />)}</div>
                )}
              </div>
            </section>

            <section className="mb-8">
              <div className="flex items-end justify-between mb-4">
                <div><h2 className="text-[19px] font-bold text-white">Project analytics</h2><p className="text-[12.5px] text-white/45 mt-0.5">Performance across all your projects</p></div>
                <select value={analyticsDays} onChange={(e) => setAnalyticsDays(Number(e.target.value))} className="text-[12px] text-white/80 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] rounded-lg px-3 py-2 outline-none cursor-pointer font-medium">
                  <option value={7} className="bg-[#12121a]">Last 7 days</option><option value={30} className="bg-[#12121a]">Last 30 days</option><option value={90} className="bg-[#12121a]">Last 90 days</option>
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
                        <defs><linearGradient id="viewsG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a78bfa" stopOpacity={0.35} /><stop offset="95%" stopColor="#a78bfa" stopOpacity={0} /></linearGradient></defs>
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} tickFormatter={(v) => { const d = new Date(v); return d.toLocaleDateString('en', { month: 'short' }) + ' ' + d.getDate() }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '12px', padding: '8px 12px' }} labelFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })} />
                        <Area type="monotone" dataKey="views" stroke="#a78bfa" strokeWidth={2} fill="url(#viewsG)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
                <ChartCard title="Traffic sources" subtitle="Where people find you"><DonutChart data={trafficData} /></ChartCard>
                <ChartCard title="Audience" subtitle="Who is visiting"><DonutChart data={audienceData} /></ChartCard>
              </div>
            </section>

            {drafts.length > 0 && (
              <section className="mb-8">
                <div className="flex items-end justify-between mb-3">
                  <div><h2 className="text-[17px] font-bold text-white flex items-center gap-2">Work in progress <span className="text-[11px] text-white/40 font-normal bg-white/[0.05] border border-white/[0.06] px-2 py-0.5 rounded-full">Unpublished · {drafts.length}</span></h2></div>
                </div>
                <div ref={draftsScrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 md:-mx-8 px-4 md:px-8">
                  {drafts.map(d => <DraftCard key={d.id} project={d} onClick={() => router.push('/projects/' + d.slug)} />)}
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === 'explore' && <ExploreView />}

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

        {activeTab === 'applications' && <ApplicationsTab />}
      </div>

      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 py-1.5 flex items-center justify-around">
        {MOBILE_PRIMARY_TABS.map(id => {
          const tab = TABS.find(t => t.id === id)
          if (!tab) return null
          const Icon = tab.icon
          const active = activeTab === id
          return <button key={id} onClick={() => setActiveTab(id)} className={'flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg min-w-[56px] ' + (active ? 'text-white' : 'text-white/45')}><Icon size={20} weight={active ? 'fill' : 'regular'} /><span className="text-[10px] font-semibold">{tab.mobileLabel}</span></button>
        })}
      </nav>
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
        {change !== 0 && <div className={'flex items-center gap-0.5 text-[10.5px] font-semibold ' + (positive ? 'text-emerald-400' : 'text-red-400')}>{positive ? <TrendUp size={10} weight="bold" /> : <TrendDown size={10} weight="bold" />}{Math.abs(change)}%</div>}
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4"><div className="mb-3"><h3 className="text-[13.5px] font-bold text-white">{title}</h3>{subtitle && <p className="text-[11px] text-white/45 mt-0.5">{subtitle}</p>}</div>{children}</div>
}

const PIE_COLORS = ['#a78bfa', '#22d3ee', '#34d399', '#fb923c', '#fb7185', '#facc15']

function DonutChart({ data }: { data: { name: string; value: number; percentage: number }[] }) {
  const hasData = data && data.some(d => d.value > 0)
  if (!hasData) return <div className="h-[200px] flex items-center justify-center"><div className="text-center"><Circle size={30} className="mx-auto mb-2 text-white/15" /><p className="text-[12px] text-white/40">No data yet</p></div></div>
  return (
    <div className="flex items-center gap-4">
      <div className="w-[130px] h-[130px] flex-shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" stroke="none">{data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer></div>
      <div className="flex-1 space-y-1.5 min-w-0">{data.map((s, i) => <div key={s.name} className="flex items-center justify-between text-[12px]"><div className="flex items-center gap-2 min-w-0"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} /><span className="text-white/60 truncate">{s.name}</span></div><span className="text-white font-bold">{s.percentage}%</span></div>)}</div>
    </div>
  )
}

function FeedRow({ event, onProjectClick, onEntityClick }: { event: FeedEvent; onProjectClick: (slug: string) => void; onEntityClick: (url: string) => void }) {
  return (
    <div className="group flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => event.project?.slug && onProjectClick(event.project.slug)}>
      <div className="flex-shrink-0">
        {event.actor?.avatar_url ? <div className="w-9 h-9 rounded-full overflow-hidden bg-white/[0.06] border border-white/[0.08]"><img src={event.actor.avatar_url} alt="" className="w-full h-full object-cover" /></div> : <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">{getActivityIcon(event.icon_type)}</div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] text-white leading-snug">{event.title}</p>
        {event.subtitle && <p className="text-[12px] text-white/50 mt-0.5 truncate">{event.subtitle}</p>}
        <div className="flex items-center gap-2 mt-1 text-[11px] text-white/40">
          <span>{timeAgo(event.created_at)}</span>
          {event.project && <><span>·</span><span className="text-white/60 font-medium truncate">{event.project.name}</span></>}
        </div>
      </div>
      {event.entity_url && event.entity_url !== '#' && <button onClick={(e) => { e.stopPropagation(); onEntityClick(event.entity_url!) }} className="flex-shrink-0 self-center text-[11px] font-semibold text-white/60 hover:text-white flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] rounded-lg px-2.5 h-7 opacity-0 group-hover:opacity-100 transition-all">{event.entity_label || 'View'} <ArrowUpRight size={10} /></button>}
    </div>
  )
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const teamCount = new Set([project.founder_id, project.user_id, ...(project.project_members || []).map(m => m.user_id), ...(project.project_roles || []).map(r => r.user_id)].filter(Boolean)).size
  const stage = STAGE_STYLES[project.stage] || STAGE_STYLES.building

  const handleClick = () => {
    // Fire tracking signal for recommendation algorithm
    fetch('/api/explore/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'click',
        entity_type: 'project',
        entity_id: project.id,
      }),
    }).catch(() => {})
    onOpen()
  }

  return (
    <div className="group w-[300px] flex-shrink-0 bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.15] hover:bg-white/[0.03] transition-all cursor-pointer" onClick={handleClick}>
      <div className="relative h-[130px] overflow-hidden">
        {project.cover_image_url ? <img src={project.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/10 flex items-center justify-center"><span className="text-5xl opacity-70">{project.icon || '\u26A1'}</span></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-3 left-3"><span className={'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ' + stage.bg + ' ' + stage.text}><span className={'w-1 h-1 rounded-full ' + stage.dot} />{STAGE_LABELS[project.stage] || project.stage.toUpperCase()}</span></div>
      </div>
      <div className="p-4">
        <h3 className="text-[15px] font-bold text-white truncate leading-tight">{project.name}</h3>
        <p className="text-[10.5px] text-white/40 font-mono mb-2">{project.project_number}</p>
        <p className="text-[13px] text-white/65 line-clamp-2 mb-3 leading-relaxed min-h-[36px]">{project.tagline || project.description || 'No description'}</p>
        <div className="flex items-center gap-3 text-[11.5px] text-white/50 mb-3">
          <span className="flex items-center gap-1"><Users size={11} weight="fill" /> {teamCount}</span>
          <span className="flex items-center gap-1"><Heart size={11} weight="fill" /> {formatNumber(project.follower_count || 0)}</span>
          <span className="flex items-center gap-1"><Eye size={11} weight="fill" /> {formatNumber(project.view_count || 0)}</span>
          {project.open_roles > 0 && <span className="flex items-center gap-1 text-orange-300 font-semibold ml-auto"><Lightning size={11} weight="fill" /> {project.open_roles} open</span>}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <span className="text-[11px] text-white/45">Updated {timeAgo(project.last_activity_at || project.updated_at)}</span>
          {/* ---- ONLY CHANGE: onOpen() → handleClick() ---- */}
          <button onClick={(e) => { e.stopPropagation(); handleClick() }} className="flex items-center gap-1 text-[11.5px] font-semibold text-white bg-white/[0.06] group-hover:bg-white group-hover:text-black px-2.5 h-7 rounded-md transition-colors">Open <ArrowRight size={11} weight="bold" /></button>
        </div>
      </div>
    </div>
  )
}

function NewProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <div onClick={onClick} className="w-[300px] flex-shrink-0 min-h-[300px] bg-gradient-to-br from-purple-500/[0.05] to-transparent border-2 border-dashed border-white/[0.1] rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-purple-400/40 hover:bg-purple-500/[0.08] transition-all group">
      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 flex items-center justify-center transition-all"><Plus size={28} weight="bold" className="text-purple-300 group-hover:text-purple-200" /></div>
      <p className="text-[15px] font-bold text-white">Start a new project</p>
      <p className="text-[12px] text-white/45 text-center px-8">Turn your next idea into reality</p>
    </div>
  )
}

function DraftCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <div onClick={onClick} className="w-[240px] flex-shrink-0 bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden hover:border-orange-500/25 hover:bg-white/[0.04] transition-all cursor-pointer group">
      <div className="relative h-[90px] overflow-hidden">
        {project.cover_image_url ? <img src={project.cover_image_url} alt="" className="w-full h-full object-cover opacity-60" /> : <div className="w-full h-full bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 flex items-center justify-center"><span className="text-3xl opacity-40">{project.icon || '\u26A1'}</span></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute top-2 left-2 text-[9px] font-bold text-orange-300 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded uppercase tracking-wider">Draft</span>
      </div>
      <div className="p-3">
        <h4 className="text-[13px] font-bold text-white truncate mb-0.5">{project.name}</h4>
        <p className="text-[10.5px] text-white/40 font-mono mb-2">{project.project_number}</p>
        <p className="text-[10.5px] text-white/50 mb-2">Last edited {timeAgo(project.updated_at)}</p>
        <button className="w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-white bg-white/[0.06] group-hover:bg-white group-hover:text-black px-2.5 h-7 rounded-md transition-colors">Continue <ArrowRight size={10} weight="bold" /></button>
      </div>
    </div>
  )
}

function ApplicationsTab() {
  const router = useRouter()
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/inbox?scope=received')
      .then(r => r.json())
      .then(j => {
        // Filter to project-related messages only
        const all = j.messages || []
        const projectOnly = all.filter((m: any) =>
          m.reference_type === 'project' ||
          m.message_type === 'role_application' ||
          m.message_type === 'connection_request' ||
          m.message_type === 'collaboration_request'
        )
        setMessages(projectOnly)
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-10 text-center text-[13px] text-white/45">Loading...</div>

  if (messages.length === 0) {
    return (
      <div>
        <h2 className="text-[19px] font-bold text-white mb-1">Applications & Connections</h2>
        <p className="text-[12.5px] text-white/45 mb-4">People reaching out about your projects</p>
        <EmptyState icon={Briefcase} title="No applications yet" subtitle="When people connect, apply, or reach out — they appear here." />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[19px] font-bold text-white">Applications & Connections <span className="text-[12px] text-white/40 font-normal">· {messages.length}</span></h2>
          <p className="text-[12.5px] text-white/45 mt-0.5">People reaching out about your projects</p>
        </div>
        <button onClick={() => router.push('/inbox')} className="text-[12px] font-semibold text-white/70 hover:text-white flex items-center gap-1">Open Inbox <ArrowRight size={11} /></button>
      </div>
      <div className="space-y-2">
        {messages.map((m: any) => {
          const isUnread = m.status === 'unread'
          return (
            <div key={m.id} onClick={() => router.push('/inbox')} className={'group flex items-start gap-3 p-4 bg-white/[0.02] border rounded-xl cursor-pointer transition-all hover:bg-white/[0.04] hover:border-white/[0.15] ' + (isUnread ? 'border-blue-500/25 border-l-2 border-l-blue-400' : 'border-white/[0.06]')}>
              <div className="w-10 h-10 rounded-full bg-white/[0.06] overflow-hidden flex-shrink-0 flex items-center justify-center">
                {m.sender?.avatar_url ? <img src={m.sender.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserPlus size={14} className="text-white/50" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className={'text-[13px] truncate ' + (isUnread ? 'font-bold text-white' : 'font-semibold text-white/85')}>{m.sender?.full_name || 'Someone'}</p>
                  <span className="text-[10px] text-white/40 flex-shrink-0">{timeAgo(m.created_at)}</span>
                </div>
                <p className={'text-[12px] truncate ' + (isUnread ? 'text-white/80' : 'text-white/60')}>{m.subject || 'Connection request'}</p>
                {m.reference_name && <p className="text-[11px] text-white/40 mt-0.5 truncate">Re: {m.reference_name}</p>}
              </div>
              <ArrowRight size={13} className="text-white/30 group-hover:text-white/70 flex-shrink-0 mt-1" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, subtitle, action }: { icon: any; title: string; subtitle: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl py-16 text-center">
      <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-white/[0.06] items-center justify-center mb-4"><Icon size={26} className="text-white/40" /></div>
      <p className="text-[15px] font-semibold text-white">{title}</p>
      <p className="text-[12.5px] text-white/45 mt-1 max-w-sm mx-auto">{subtitle}</p>
      {action && <button onClick={action.onClick} className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold bg-white text-black hover:bg-white/90 px-4 h-9 rounded-lg">{action.label} <ArrowRight size={12} weight="bold" /></button>}
    </div>
  )
}