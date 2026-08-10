'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  HandWaving, Brain, Code, Wrench, Network
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

interface ActivityItem {
  id: string; type: string; title: string; subtitle: string | null
  icon: string; color: string; created_at: string
  actor?: { id: string; full_name: string; username: string; avatar_url: string | null }
  project?: { id: string; name: string; slug: string; icon: string; color: string; project_number: string }
  metadata?: Record<string, any>
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
  projects: Project[]; drafts: Project[]; activity: ActivityItem[]
  analytics: Analytics
  viewsOverTime: { date: string; views: number; unique_views: number }[]
  trafficSources: { name: string; value: number; percentage: number }[]
  audienceBreakdown: { name: string; value: number; percentage: number }[]
  following: Project[]
  stats: { totalProjects: number; activeProjects: number; totalFollowers: number; totalApplications: number; totalTeamMembers: number; totalRecruiting: number }
}

const TABS = [
  { id: 'my-projects', label: 'My Projects', icon: FolderSimple, mobileLabel: 'Projects' },
  { id: 'explore', label: 'Explore Projects', icon: Compass, mobileLabel: 'Explore' },
  { id: 'following', label: 'Following', icon: Heart, mobileLabel: 'Following' },
  { id: 'wip', label: 'DSRT Project Assistant', icon: Robot, mobileLabel: 'COCO' },
  { id: 'studio', label: 'Project Studio', icon: PaintBrushBroad, mobileLabel: 'Studio' },
  { id: 'archived', label: 'Archived', icon: Archive, mobileLabel: 'Archived' },
  { id: 'resources', label: 'Resources', icon: BookOpen, mobileLabel: 'Resources' },
  { id: 'discussions', label: 'Discussions', icon: ChatsCircle, mobileLabel: 'Discuss' },
] as const

type TabId = typeof TABS[number]['id']

const MOBILE_PRIMARY_TABS: TabId[] = ['my-projects', 'explore', 'following', 'wip']
const MOBILE_MORE_TABS: TabId[] = ['studio', 'archived', 'resources', 'discussions']

const STAGE_COLORS: Record<string, string> = {
  idea: 'bg-purple-500/80', planning: 'bg-blue-500/80', building: 'bg-cyan-500/80',
  prototype: 'bg-orange-500/80', alpha: 'bg-emerald-500/80', beta: 'bg-yellow-500/80',
  mvp: 'bg-green-500/80', launched: 'bg-red-500/80', scaling: 'bg-pink-500/80',
}

const STAGE_LABELS: Record<string, string> = {
  idea: 'IDEA', planning: 'PLANNING', building: 'BUILDING', prototype: 'PROTOTYPE',
  alpha: 'ALPHA', beta: 'BETA', mvp: 'MVP', launched: 'LAUNCHED', scaling: 'SCALING',
}

const PIE_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1']

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
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

function getActivityIcon(type: string) {
  const map: Record<string, React.ReactNode> = {
    new_follower: <Heart weight="fill" className="text-red-400" />,
    member_joined: <UserPlus weight="fill" className="text-green-400" />,
    project_saved: <BookmarkSimple weight="fill" className="text-yellow-400" />,
    task_created: <ListChecks weight="fill" className="text-blue-400" />,
    task_status_changed: <ArrowsClockwise weight="fill" className="text-cyan-400" />,
    application: <Briefcase weight="fill" className="text-purple-400" />,
    stage_change: <Rocket weight="fill" className="text-orange-400" />,
    featured: <Star weight="fill" className="text-yellow-400" />,
    update_published: <PencilSimpleLine weight="fill" className="text-blue-400" />,
    collaboration_request: <UsersThree weight="fill" className="text-green-400" />,
  }
  return map[type] || <Globe weight="fill" className="text-gray-400" />
}

// ═══════════════════════════════════════════════════════════════
// COCO ASSISTANT BANNER
// ═══════════════════════════════════════════════════════════════
function CocoAssistantBanner({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-purple-500/25 shadow-2xl shadow-purple-900/40" style={{ aspectRatio: '620 / 890' }}>
      <Image
        src="/banners/coco-bg.png"
        alt=""
        fill
        className="object-cover pointer-events-none select-none"
        priority
        sizes="340px"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b3d] via-[#2d0e5c] to-[#0a0420] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent pointer-events-none" />

      <div className="absolute inset-0 flex flex-col p-[4.5%] text-white">
        <div className="flex items-start justify-between gap-2 mb-[3%]">
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md border border-purple-400/30 rounded-full pl-1.5 pr-2 py-[3px]">
            <Sparkle weight="fill" className="text-purple-200" style={{ width: '9px', height: '9px' }} />
            <span className="font-semibold text-white" style={{ fontSize: '9px' }}>DSRT COCO</span>
            <span className="font-bold text-white bg-purple-500 px-[5px] py-[1px] rounded" style={{ fontSize: '7px' }}>BETA</span>
          </div>
          <div className="bg-black/50 backdrop-blur-md border border-purple-400/25 rounded-lg px-2 py-1 text-right">
            <p className="text-purple-200 leading-tight" style={{ fontSize: '7.5px' }}>Powered by</p>
            <p className="font-bold text-white leading-tight" style={{ fontSize: '9px' }}>DSRT AI 💜</p>
          </div>
        </div>

        <div className="mb-[2.5%] max-w-[62%]">
          <h2 className="text-white font-bold leading-[1.15]" style={{ fontSize: '15px' }}>
            Meet COCO —
          </h2>
          <h2 className="font-bold leading-[1.15]" style={{ fontSize: '15px' }}>
            <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              your AI teammate.
            </span>
          </h2>
        </div>

        <p className="text-zinc-300 leading-snug mb-[4%] max-w-[58%]" style={{ fontSize: '9.5px' }}>
          Plans, builds, predicts, fixes.<br />
          <span className="text-purple-300 font-medium">One cute pet, infinite power.</span>
        </p>

        <div className="space-y-[6px] mb-[4%] max-w-[60%]">
          <FeatureRow
            icon={<Brain weight="fill" style={{ width: '11px', height: '11px' }} className="text-purple-300" />}
            title="Plans complex tasks"
            body="Turns big goals into clear steps."
          />
          <FeatureRow
            icon={<Wrench weight="fill" style={{ width: '11px', height: '11px' }} className="text-purple-300" />}
            title="Fixes problems, any domain"
            body="Business, tech, ops — solved."
          />
          <FeatureRow
            icon={<Code weight="fill" style={{ width: '11px', height: '11px' }} className="text-purple-300" />}
            title="Codes & builds systems"
            body="Full workspace for developers."
          />
          <FeatureRow
            icon={<Network weight="fill" style={{ width: '11px', height: '11px' }} className="text-purple-300" />}
            title="Orchestrates expert agents"
            body="Specialists in every industry."
          />
        </div>

        <div className="flex-1" />

        <div className="bg-black/55 backdrop-blur-md border border-purple-400/30 rounded-xl p-[3%] mb-[3%]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Crown weight="fill" className="text-yellow-400 flex-shrink-0" style={{ width: '14px', height: '14px' }} />
            <p className="font-bold text-white" style={{ fontSize: '11px' }}>COCO Pro</p>
            <span className="font-bold text-white bg-purple-500 px-1.5 py-[1px] rounded" style={{ fontSize: '7px' }}>PRO</span>
          </div>
          <p className="text-zinc-300 leading-snug mb-2" style={{ fontSize: '8.5px' }}>
            Billed per use. Automate business or ship production code.
          </p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {['Unlimited Agents', 'Full Automation', 'Code Editor', 'Priority Support'].map(item => (
              <div key={item} className="flex items-center gap-1">
                <CheckCircle weight="fill" className="text-purple-400 flex-shrink-0" style={{ width: '9px', height: '9px' }} />
                <span className="text-zinc-300 truncate" style={{ fontSize: '8px' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onOpen}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/40 transition-all hover:shadow-purple-500/60 hover:scale-[1.01] py-2.5"
          style={{ fontSize: '11.5px' }}
        >
          <Sparkle weight="fill" style={{ width: '12px', height: '12px' }} />
          Open Project Assistant
          <ArrowRight style={{ width: '12px', height: '12px' }} />
        </button>
      </div>
    </div>
  )
}

function FeatureRow({ icon, title, body }: {
  icon: React.ReactNode; title: string; body: string
}) {
  return (
    <div className="bg-black/50 backdrop-blur-md border border-purple-400/20 rounded-lg px-2 py-1.5 flex items-start gap-2">
      <div className="rounded-md bg-purple-500/25 flex items-center justify-center flex-shrink-0" style={{ width: '22px', height: '22px' }}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-white leading-tight" style={{ fontSize: '10px' }}>{title}</p>
        <p className="text-zinc-400 leading-tight mt-[1px]" style={{ fontSize: '8.5px' }}>{body}</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CREATE PROJECT BANNER
// ═══════════════════════════════════════════════════════════════
function CreateProjectBanner({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-purple-500/20 shadow-xl shadow-purple-900/20" style={{ aspectRatio: '620 / 388' }}>
      <Image
        src="/banners/create-project-bg.png"
        alt=""
        fill
        className="object-cover pointer-events-none select-none"
        sizes="340px"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b3d] via-[#2d1266] to-[#0a0420] -z-10 flex items-center justify-end pr-4">
        <Rocket size={100} className="text-purple-400/30" weight="duotone" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent" />

      <div className="absolute inset-0 p-[5%] flex flex-col justify-between text-white">
        <div className="max-w-[70%]">
          <h3 className="font-bold leading-tight" style={{ fontSize: '16px' }}>Have an idea?</h3>
          <p className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent font-bold leading-tight mt-0.5" style={{ fontSize: '16px' }}>
            Build something amazing.
          </p>
          <p className="mt-2 text-zinc-300 leading-snug" style={{ fontSize: '10px' }}>
            Create your project, find the right builders and turn your idea into real-world impact.
          </p>
        </div>

        <button
          onClick={onCreate}
          className="w-full bg-white/10 backdrop-blur-md border border-purple-400/40 hover:bg-purple-500/25 hover:border-purple-400/70 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] py-2"
          style={{ fontSize: '11.5px' }}
        >
          <Plus weight="bold" style={{ width: '13px', height: '13px' }} />
          Create New Project
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
  const activityScrollRef = useRef<HTMLDivElement>(null)

  const [activeTab, setActiveTab] = useState<TabId>('my-projects')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [analyticsDays, setAnalyticsDays] = useState(30)
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/projects/dashboard?days=' + analyticsDays)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Fetch dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }, [analyticsDays])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); setSearchOpen(false); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/projects/search?q=' + encodeURIComponent(searchQuery))
        const json = await res.json()
        setSearchResults(json.results || [])
        setSearchOpen(true)
      } catch { setSearchResults([]) }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

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

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-[#0a0a0f] pb-20 xl:pb-0">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 gap-4">
            <div><Skeleton className="h-8 w-40 bg-white/5 mb-2" /><Skeleton className="h-4 w-72 bg-white/5" /></div>
            <Skeleton className="h-10 w-full md:w-[380px] bg-white/5 rounded-lg" />
          </div>
          <div className="hidden md:flex gap-2 mb-6 border-b border-white/5 pb-3">
            {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-8 w-24 bg-white/5 rounded-md" />)}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mb-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 bg-white/5 rounded-lg" />)}
          </div>
        </div>
      </div>
    )
  }

  const projects = data?.projects || []
  const drafts = data?.drafts || []
  const activity = data?.activity || []
  const analytics = data?.analytics
  const stats = data?.stats
  const viewsData = data?.viewsOverTime || []
  const trafficData = data?.trafficSources || []
  const audienceData = data?.audienceBreakdown || []

  const StatCard = ({ icon, value, label, color }: {
    icon: React.ReactNode; value: number | string; label: string; color: string
  }) => (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 md:px-4 py-3 flex items-center gap-2.5 md:gap-3 hover:bg-white/[0.05] transition-colors">
      <div className={'w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ' + color}>{icon}</div>
      <div className="min-w-0">
        <p className="text-lg md:text-xl font-bold text-white leading-none">{typeof value === 'number' ? formatNumber(value) : value}</p>
        <p className="text-[10px] md:text-[11px] text-zinc-500 mt-0.5">{label}</p>
      </div>
    </div>
  )

  const MetricChip = ({ label, value, change }: { label: string; value: number; change: number }) => (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 md:px-4 py-3 text-center min-w-[110px] md:min-w-[120px] flex-shrink-0">
      <p className="text-[10px] md:text-[11px] text-zinc-500 mb-1">{label}</p>
      <p className="text-base md:text-lg font-bold text-white">{formatNumber(value)}</p>
      <div className={'flex items-center justify-center gap-1 mt-1 text-[10px] md:text-[11px] ' + (change >= 0 ? 'text-emerald-400' : 'text-red-400')}>
        {change >= 0 ? <TrendUp size={11} /> : <TrendDown size={11} />}
        <span>{Math.abs(change)}%</span>
      </div>
    </div>
  )

  const ProjectCard = ({ project }: { project: Project }) => {
    const teamCount = new Set([project.founder_id, project.user_id, ...(project.project_members || []).map(m => m.user_id), ...(project.project_roles || []).map(r => r.user_id)].filter(Boolean)).size
    return (
      <div className="group relative w-[280px] flex-shrink-0 bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-purple-500/30 transition-all cursor-pointer" onClick={() => router.push('/projects/' + project.slug)}>
        <div className="relative h-[110px] overflow-hidden">
          {project.cover_image_url ? (
            <img src={project.cover_image_url} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/10 flex items-center justify-center">
              <span className="text-4xl">{project.icon || '\u26A1'}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-3 left-3">
            <span className={'px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider ' + (STAGE_COLORS[project.stage] || 'bg-gray-500/80')}>
              {STAGE_LABELS[project.stage] || project.stage}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-sm font-semibold text-white truncate">{project.name}</h3>
          <p className="text-[10px] text-zinc-600 font-mono mb-2">{project.project_number}</p>
          <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">{project.tagline || project.description || 'No description'}</p>
          <div className="flex items-center gap-3 text-[11px] text-zinc-500 mb-3">
            <span className="flex items-center gap-1"><Users size={12} /> {teamCount} Builder{teamCount !== 1 ? 's' : ''}</span>
            {project.open_roles > 0 && <span className="flex items-center gap-1 text-emerald-400"><Lightning size={12} /> {project.open_roles} Open Role{project.open_roles !== 1 ? 's' : ''}</span>}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
            <span className="text-[10px] text-zinc-600">Updated {timeAgo(project.last_activity_at || project.updated_at)}</span>
            <button className="flex items-center gap-1 text-[11px] text-white bg-white/[0.06] hover:bg-purple-500/20 hover:text-purple-300 px-3 py-1.5 rounded-md transition-colors font-medium" onClick={(e) => { e.stopPropagation(); router.push('/projects/' + project.slug) }}>
              Open Workspace <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const NewProjectCard = () => (
    <div className="w-[280px] flex-shrink-0 bg-white/[0.02] border border-dashed border-white/[0.1] rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-purple-500/40 hover:bg-purple-500/5 transition-all min-h-[280px]" onClick={() => router.push('/projects/new')}>
      <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center"><Plus size={24} className="text-purple-400" /></div>
      <p className="text-sm font-medium text-white">New Project</p>
      <p className="text-xs text-zinc-500 text-center px-6">Start building something amazing</p>
    </div>
  )

  const DraftCard = ({ project }: { project: Project }) => (
    <div className="w-[220px] flex-shrink-0 bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-orange-500/30 transition-all cursor-pointer" onClick={() => router.push('/projects/' + project.slug)}>
      <div className="relative h-[80px] overflow-hidden">
        {project.cover_image_url ? (
          <img src={project.cover_image_url} alt={project.name} className="w-full h-full object-cover opacity-50" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center"><span className="text-2xl opacity-40">{project.icon || '\u26A1'}</span></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute top-2 left-2"><span className="px-2 py-0.5 rounded text-[9px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 uppercase tracking-wider">Draft</span></div>
      </div>
      <div className="p-3">
        <h4 className="text-xs font-semibold text-white truncate mb-0.5">{project.name}</h4>
        <p className="text-[10px] text-zinc-600 font-mono mb-1">{project.project_number}</p>
        <p className="text-[10px] text-zinc-500 mb-2">Stage: {STAGE_LABELS[project.stage] || project.stage}</p>
        <p className="text-[10px] text-zinc-600 mb-2">Last edited {timeAgo(project.updated_at)}</p>
        <button className="flex items-center gap-1 text-[10px] text-white bg-white/[0.06] hover:bg-white/[0.1] px-2.5 py-1 rounded transition-colors w-full justify-center font-medium">Continue Editing <ArrowRight size={10} /></button>
      </div>
    </div>
  )

  return (
    <div className="flex-1 min-h-screen bg-[#0a0a0f] pb-20 xl:pb-0">
      <div className="flex flex-col xl:flex-row">
        <div className="flex-1 min-w-0 px-4 md:px-6 py-4 md:py-6 max-w-full xl:max-w-[calc(100%-360px)]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-5 gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Projects</h1>
              <p className="text-xs md:text-sm text-zinc-500 mt-0.5">Build, collaborate and ship amazing projects together.</p>
            </div>
            <div className="relative w-full md:w-[380px]">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <Input id="project-search" placeholder="Search projects, technologies, keywords..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)} onBlur={() => setTimeout(() => setSearchOpen(false), 200)} className="pl-9 pr-14 h-10 bg-white/[0.04] border-white/[0.08] text-white text-sm placeholder:text-zinc-600 rounded-lg focus:ring-purple-500/30 focus:border-purple-500/30" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-0.5 text-zinc-600"><Command size={12} /><span className="text-[10px] font-mono">K</span></div>
              {searchOpen && searchResults.length > 0 && (
                <div className="absolute z-50 top-12 left-0 right-0 bg-[#12121a] border border-white/[0.08] rounded-lg shadow-2xl max-h-[360px] overflow-y-auto">
                  {searchResults.map((r: any) => (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] cursor-pointer border-b border-white/[0.04] last:border-0" onClick={() => { router.push('/projects/' + r.slug); setSearchOpen(false); setSearchQuery('') }}>
                      <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-lg flex-shrink-0">{r.icon || '\u26A1'}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white font-medium truncate">{r.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{r.project_number} · {r.tagline || r.description || 'No description'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center justify-between border-b border-white/[0.06] mb-5">
            <div className="flex gap-0.5 -mb-px overflow-x-auto scrollbar-hide">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={'px-3.5 py-2.5 text-[12px] font-medium whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ' + (activeTab === tab.id ? 'text-purple-400 border-purple-500' : 'text-zinc-500 border-transparent hover:text-zinc-300')}>
                  <tab.icon size={13} weight={activeTab === tab.id ? 'fill' : 'regular'} />
                  {tab.label}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => router.push('/projects/new')} className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-4 h-8 rounded-lg mb-2 ml-3 flex-shrink-0">
              <Plus size={14} className="mr-1" /> New Project
            </Button>
          </div>

          <div className="md:hidden mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(() => {
                const t = TABS.find(t => t.id === activeTab)
                if (!t) return null
                const Icon = t.icon
                return <><Icon size={16} weight="fill" className="text-purple-400" /><h2 className="text-sm font-semibold text-white">{t.label}</h2></>
              })()}
            </div>
            <Button size="sm" onClick={() => router.push('/projects/new')} className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 h-8 rounded-lg">
              <Plus size={12} className="mr-1" /> New
            </Button>
          </div>

          {activeTab === 'my-projects' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mb-6">
                <StatCard icon={<FolderSimple size={18} className="text-blue-300" />} value={stats?.totalProjects || 0} label="Total Projects" color="bg-blue-500/10" />
                <StatCard icon={<Lightning size={18} className="text-emerald-300" />} value={stats?.activeProjects || 0} label="Active Projects" color="bg-emerald-500/10" />
                <StatCard icon={<Briefcase size={18} className="text-orange-300" />} value={stats?.totalRecruiting || 0} label="Recruiting" color="bg-orange-500/10" />
                <StatCard icon={<Heart size={18} className="text-red-300" />} value={stats?.totalFollowers || 0} label="Followers" color="bg-red-500/10" />
                <StatCard icon={<Users size={18} className="text-cyan-300" />} value={stats?.totalTeamMembers || 0} label="Team Members" color="bg-cyan-500/10" />
                <StatCard icon={<Briefcase size={18} className="text-purple-300" />} value={stats?.totalApplications || 0} label="Applications" color="bg-purple-500/10" />
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-white">Continue Building</h2>
                  {projects.length > 3 && (
                    <button onClick={() => setShowAllProjects(!showAllProjects)} className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium">
                      {showAllProjects ? 'Collapse' : 'View all'} <ArrowRight size={12} />
                    </button>
                  )}
                </div>
                {showAllProjects ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map(p => <ProjectCard key={p.id} project={p} />)}
                    <NewProjectCard />
                  </div>
                ) : (
                  <div className="relative">
                    {projects.length > 3 && (
                      <>
                        <button onClick={() => scroll(scrollContainerRef, 'left')} className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/80 border border-white/10 items-center justify-center hover:bg-white/10 transition-colors"><CaretLeft size={14} className="text-white" /></button>
                        <button onClick={() => scroll(scrollContainerRef, 'right')} className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/80 border border-white/10 items-center justify-center hover:bg-white/10 transition-colors"><CaretRight size={14} className="text-white" /></button>
                      </>
                    )}
                    <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                      {projects.map(p => <ProjectCard key={p.id} project={p} />)}
                      <NewProjectCard />
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-white">Project Activity</h2>
                  <button className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium">View all <ArrowRight size={12} /></button>
                </div>
                <div ref={activityScrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {activity.length === 0 ? (
                    <div className="w-full text-center py-8 text-zinc-600 text-sm">No activity yet. Start building to see updates here.</div>
                  ) : activity.map(item => (
                    <div key={item.id} className="flex-shrink-0 w-[175px] bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 hover:border-white/[0.1] transition-colors">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.04] mb-2.5 mx-auto">{getActivityIcon(item.type)}</div>
                      <p className="text-[11px] text-white text-center leading-snug line-clamp-2 font-medium">{item.title}</p>
                      {item.subtitle && <p className="text-[10px] text-zinc-500 text-center mt-0.5 truncate">{item.subtitle}</p>}
                      <p className="text-[9px] text-zinc-600 text-center mt-1.5">{timeAgo(item.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-white">Project Analytics</h2>
                  <select value={analyticsDays} onChange={(e) => setAnalyticsDays(Number(e.target.value))} className="text-[11px] text-zinc-400 bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1">
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                  </select>
                </div>
                {analytics && (
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
                    <MetricChip label="Views" value={analytics.views?.value || 0} change={analytics.views?.change || 0} />
                    <MetricChip label="Unique Visitors" value={analytics.unique_views?.value || 0} change={analytics.unique_views?.change || 0} />
                    <MetricChip label="Followers" value={analytics.followers?.value || 0} change={analytics.followers?.change || 0} />
                    <MetricChip label="Applications" value={analytics.applications?.value || 0} change={analytics.applications?.change || 0} />
                    <MetricChip label="Profile CTR" value={analytics.profile_ctr?.value || 0} change={analytics.profile_ctr?.change || 0} />
                    <MetricChip label="Saves" value={analytics.saves?.value || 0} change={analytics.saves?.change || 0} />
                    <MetricChip label="Shares" value={analytics.shares?.value || 0} change={analytics.shares?.change || 0} />
                    <MetricChip label="Messages" value={analytics.messages?.value || 0} change={analytics.messages?.change || 0} />
                    <MetricChip label="Overall Growth" value={analytics.overall_growth?.value || 0} change={analytics.overall_growth?.change || 0} />
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <h3 className="text-xs font-medium text-zinc-400 mb-3">Views Over Time</h3>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={viewsData}>
                          <defs><linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} /></linearGradient></defs>
                          <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#52525b' }} tickFormatter={(v) => { const d = new Date(v); return d.toLocaleDateString('en', { month: 'short' }) + ' ' + d.getDate() }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 9, fill: '#52525b' }} axisLine={false} tickLine={false} width={30} />
                          <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} labelFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })} />
                          <Area type="monotone" dataKey="views" stroke="#8B5CF6" fill="url(#vg)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <h3 className="text-xs font-medium text-zinc-400 mb-3">Traffic Sources</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-[120px] h-[120px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart><Pie data={trafficData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" stroke="none">{trafficData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie></PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {trafficData.map((s: any, i: number) => (
                          <div key={s.name} className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} /><span className="text-zinc-400">{s.name}</span></div>
                            <span className="text-white font-medium">{s.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <h3 className="text-xs font-medium text-zinc-400 mb-3">Audience Interests</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-[120px] h-[120px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart><Pie data={audienceData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" stroke="none">{audienceData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie></PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {audienceData.map((item: any, i: number) => (
                          <div key={item.name} className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} /><span className="text-zinc-400">{item.name}</span></div>
                            <span className="text-white font-medium">{item.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {drafts.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-white">Work In Progress <span className="text-zinc-500 font-normal">(Unpublished)</span></h2>
                    <button className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium">View all <ArrowRight size={12} /></button>
                  </div>
                  <div ref={draftsScrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">{drafts.map(d => <DraftCard key={d.id} project={d} />)}</div>
                </div>
              )}

              <div className="xl:hidden space-y-4 mt-8">
                <CocoAssistantBanner onOpen={openAssistant} />
                <CreateProjectBanner onCreate={() => router.push('/projects/new')} />
              </div>
            </>
          )}

          {activeTab === 'following' && (
            <div>
              <h2 className="text-sm font-semibold text-white mb-4">Projects You Follow</h2>
              {(data?.following || []).length === 0 ? (
                <div className="text-center py-16 text-zinc-600">
                  <Heart size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">You haven&apos;t followed any projects yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(data?.following || []).map((p: any) => <ProjectCard key={p.id} project={p} />)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'explore' && <ExploreView />}

          {activeTab === 'wip' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Robot size={20} weight="fill" className="text-purple-400" />
                <h2 className="text-sm font-semibold text-white">DSRT Project Assistant</h2>
                <span className="text-[9px] font-bold text-purple-100 bg-purple-500/40 px-1.5 py-0.5 rounded">BETA</span>
              </div>
              <div className="text-center py-16 text-zinc-600">
                <div className="inline-flex items-center gap-2 mb-4 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2">
                  <HandWaving size={16} weight="fill" className="text-purple-300" />
                  <span className="text-sm text-purple-200">Hi! I&apos;m COCO</span>
                </div>
                <p className="text-sm text-zinc-400">Your AI co-pilot for building better projects</p>
                <p className="text-xs mt-1 text-zinc-600">Full assistant experience coming in next build.</p>
              </div>
            </div>
          )}

          {activeTab === 'archived' && (<div className="text-center py-16 text-zinc-600"><Archive size={32} className="mx-auto mb-3 opacity-40" /><p className="text-sm">No archived projects.</p></div>)}

          {['studio', 'resources', 'discussions'].includes(activeTab) && (<div className="text-center py-16 text-zinc-600"><Browsers size={32} className="mx-auto mb-3 opacity-40" /><p className="text-sm">{TABS.find(t => t.id === activeTab)?.label} — Coming soon</p></div>)}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="w-[340px] flex-shrink-0 border-l border-white/[0.06] px-4 py-6 space-y-4 hidden xl:block sticky top-0 h-screen overflow-y-auto scrollbar-hide">
          <CocoAssistantBanner onOpen={openAssistant} />
          <CreateProjectBanner onCreate={() => router.push('/projects/new')} />
        </aside>
      </div>

      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 py-1.5 flex items-center justify-around">
        {MOBILE_PRIMARY_TABS.map(id => {
          const tab = TABS.find(t => t.id === id)
          if (!tab) return null
          const Icon = tab.icon
          const active = activeTab === id
          return (
            <button key={id} onClick={() => setActiveTab(id)} className={'flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg transition-colors min-w-[56px] ' + (active ? 'text-purple-400' : 'text-zinc-500')}>
              <Icon size={20} weight={active ? 'fill' : 'regular'} />
              <span className="text-[9px] font-medium">{tab.mobileLabel}</span>
            </button>
          )
        })}
        <button onClick={() => setMoreSheetOpen(true)} className="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg transition-colors min-w-[56px] text-zinc-500 hover:text-zinc-300">
          <DotsThreeOutline size={20} weight="regular" />
          <span className="text-[9px] font-medium">More</span>
        </button>
      </nav>

      {moreSheetOpen && (
        <>
          <div className="xl:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setMoreSheetOpen(false)} />
          <div className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#12121a] border-t border-white/[0.08] rounded-t-2xl p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">More Options</h3>
              <button onClick={() => setMoreSheetOpen(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MOBILE_MORE_TABS.map(id => {
                const tab = TABS.find(t => t.id === id)
                if (!tab) return null
                const Icon = tab.icon
                return (
                  <button key={id} onClick={() => { setActiveTab(id); setMoreSheetOpen(false) }} className={'flex items-center gap-3 p-3 rounded-xl transition-colors ' + (activeTab === id ? 'bg-purple-500/10 border border-purple-500/20 text-purple-300' : 'bg-white/[0.03] border border-white/[0.06] text-zinc-300 hover:bg-white/[0.05]')}>
                    <Icon size={18} weight={activeTab === id ? 'fill' : 'regular'} />
                    <span className="text-sm font-medium">{tab.label}</span>
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
