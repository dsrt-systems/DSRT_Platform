'use client'

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// Create Project Modal Component
import { CreateProjectModal } from '@/components/projects/CreateProjectModal'

// Explore page
import { ProjectExplorePage } from '@/components/projects-explore/ProjectExplorePage'

import {
  Plus, CircleNotch, CaretDown, WarningCircle, Heart, Briefcase,
  DotsThree, MapPin, Users, ArrowRight, ArrowSquareOut, Star, BookmarkSimple,
  Wrench, GitBranch, CheckCircle, Lightbulb, ShieldCheck, SquaresFour
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Project {
  id: string
  slug: string
  name: string
  tagline?: string | null
  short_description?: string | null
  description?: string | null
  logo_url?: string | null
  cover_image_url?: string | null
  stage?: string
  status?: string
  industry?: string | null
  location?: string | null
  project_number?: string | null
  project_type?: string | null
  is_open_source?: boolean
  is_dsrt_verified?: boolean
  is_hiring?: boolean
  team_size?: number
  open_roles?: number
  follower_count?: number
  view_count?: number
  tech_stack?: string[]
  category?: string[]
  updated_at?: string
  created_at?: string
  last_activity_at?: string
  founder?: {
    username: string
    full_name: string
    avatar_url?: string | null
  }
}

type TabId = 'my-projects' | 'explore' | 'following' | 'applications'
type QuickStatus = 'all' | 'active' | 'completed' | 'archived'
type SortOption = 'updated' | 'created' | 'name' | 'stage'

// ═══ DSRT Custom Geometric Tab Icons ═══
type IconProps = React.SVGProps<SVGSVGElement>

const IconMyProjects = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
)

const IconExplore = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
)

const IconFollowing = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
)

const IconApplications = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)

const TABS = [
  { id: 'my-projects', label: 'My Projects', icon: IconMyProjects },
  { id: 'explore',     label: 'Explore',     icon: IconExplore },
  { id: 'following',   label: 'Following',   icon: IconFollowing },
  { id: 'applications', label: 'Applications', icon: IconApplications },
]

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

function timeAgo(iso?: string | null): string {
  if (!iso) return ''
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.max(0, now - then)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export function ProjectsDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090b] text-white p-10 flex items-center justify-center">
          <CircleNotch size={24} className="animate-spin text-zinc-500 mr-2" />
          <span className="text-xs text-zinc-500 font-mono">Loading workspace...</span>
        </div>
      }
    >
      <ProjectsDashboardContent />
    </Suspense>
  )
}

function ProjectsDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const tab = searchParams.get('tab')
    if (tab === 'explore' || tab === 'following' || tab === 'applications') return tab
    return 'my-projects'
  })

  const [user, setUser] = useState<any>(null)
  const [myProjects, setMyProjects] = useState<Project[]>([])
  const [drafts, setDrafts] = useState<Project[]>([])
  const [followingProjects, setFollowingProjects] = useState<Project[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [draftLimitInfo, setDraftLimitInfo] = useState<{ count: number; limit: number } | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [quickStatus, setQuickStatus] = useState<QuickStatus>('all')
  const [sortOption, setSortOption] = useState<SortOption>('updated')
  const [sortOpen, setSortOpen] = useState(false)

  const [deleteModalProject, setDeleteModalProject] = useState<Project | null>(null)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Create Project Modal triggers
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const loadWorkspaceData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, avatar_url, username')
          .eq('id', authUser.id)
          .maybeSingle()
        setUser(profile ? { ...authUser, profile } : authUser)
      }

      const [dashRes, resourcesRes, draftCountRes] = await Promise.all([
        fetch('/api/projects/dashboard'),
        supabase
          .from('founder_resources')
          .select('*')
          .order('display_order', { ascending: true }),
        fetch('/api/projects/drafts/count').then(r => r.json()).catch(() => null)
      ])

      if (dashRes.ok) {
        const data = await dashRes.json()
        setMyProjects(data.projects || [])
        setDrafts(data.drafts || [])
      } else {
        setError(true)
      }

      if (resourcesRes.data) {
        setResources(resourcesRes.data)
      }

      if (draftCountRes && typeof draftCountRes.count === 'number') {
        setDraftLimitInfo({ count: draftCountRes.count, limit: draftCountRes.limit || 10 })
      }
    } catch (e) {
      console.error('Projects dashboard fetch error:', e)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadWorkspaceData()
  }, [loadWorkspaceData])

  useEffect(() => {
    if (activeTab === 'following') {
      fetch('/api/projects/dashboard')
        .then(r => r.json())
        .then(d => setFollowingProjects(d.following || []))
        .catch(() => {})
    }
  }, [activeTab])

  const handleConfirmDelete = async () => {
    if (!deleteModalProject || deleteConfirmInput.trim() !== deleteModalProject.name.trim()) {
      toast.error('Project name does not match')
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${deleteModalProject.slug}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to archive project')

      toast.success('Project archived')
      setMyProjects(prev => prev.filter(p => p.id !== deleteModalProject.id))
      setDrafts(prev => prev.filter(p => p.id !== deleteModalProject.id))
      setDeleteModalProject(null)
      setDeleteConfirmInput('')
    } catch (e: any) {
      toast.error(e.message || 'Could not archive project')
    } finally {
      setDeleting(false)
    }
  }

  const sortedProjects = useMemo(() => {
    return [...myProjects].sort((a, b) => {
      if (sortOption === 'created') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      }
      if (sortOption === 'name') {
        return a.name.localeCompare(b.name)
      }
      if (sortOption === 'stage') {
        return (a.stage || '').localeCompare(b.stage || '')
      }
      return (
        new Date(b.last_activity_at || b.updated_at || b.created_at || 0).getTime() -
        new Date(a.last_activity_at || a.updated_at || a.created_at || 0).getTime()
      )
    })
  }, [myProjects, sortOption])

  const filteredByStatus = useMemo(() => {
    if (quickStatus === 'all') return sortedProjects
    if (quickStatus === 'active') {
      return sortedProjects.filter(p => p.status !== 'archived' && p.status !== 'completed')
    }
    if (quickStatus === 'completed') {
      return sortedProjects.filter(p => p.status === 'completed')
    }
    if (quickStatus === 'archived') {
      return sortedProjects.filter(p => p.status === 'archived')
    }
    return sortedProjects
  }, [sortedProjects, quickStatus])

  const statusCounts = useMemo(() => ({
    all: sortedProjects.length,
    active: sortedProjects.filter(p => p.status !== 'archived' && p.status !== 'completed').length,
    completed: sortedProjects.filter(p => p.status === 'completed').length,
    archived: sortedProjects.filter(p => p.status === 'archived').length,
  }), [sortedProjects])

  const sections = useMemo(() => {
    const now = Date.now()
    const twoWeeks = 14 * 24 * 60 * 60 * 1000

    const actively_building = filteredByStatus.filter(p => {
      const activeStages = ['idea', 'planning', 'prototype', 'development', 'building', 'testing', 'mvp']
      return activeStages.includes(p.stage || '') && p.status !== 'archived' && p.status !== 'completed'
    })

    const recently_updated = filteredByStatus.filter(p => {
      const ts = new Date(p.last_activity_at || p.updated_at || 0).getTime()
      return ts > 0 && (now - ts) < twoWeeks && !actively_building.some(x => x.id === p.id)
    })

    const research_and_experiments = filteredByStatus.filter(p => {
      const isResearch = p.project_type === 'research' || p.project_type === 'experiment' || p.stage === 'research'
      return isResearch && !actively_building.some(x => x.id === p.id) && !recently_updated.some(x => x.id === p.id)
    })

    const open_source = filteredByStatus.filter(p => {
      return p.is_open_source && !actively_building.some(x => x.id === p.id) &&
             !recently_updated.some(x => x.id === p.id) &&
             !research_and_experiments.some(x => x.id === p.id)
    })

    const shownIds = new Set([
      ...actively_building.map(p => p.id),
      ...recently_updated.map(p => p.id),
      ...research_and_experiments.map(p => p.id),
      ...open_source.map(p => p.id),
    ])

    const other = filteredByStatus.filter(p => !shownIds.has(p.id))

    return { actively_building, recently_updated, research_and_experiments, open_source, other }
  }, [filteredByStatus])

  const firstName =
    user?.profile?.full_name?.split(' ')[0] ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    'Builder'

  return (
    <div className="flex-1 min-h-screen bg-[#05070D] text-white pb-24 font-sans w-full">
      <div className="max-w-[1240px] mx-auto px-4 md:px-6 pt-8 w-full">

        {/* ── HEADER ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight text-white leading-snug">
              {greeting()},{' '}
              <span className="text-white/80">
                {firstName}.
              </span>
            </h1>
            <p className="text-[14px] text-zinc-400 mt-1.5 font-medium">
              Everything you're building, experimenting with, researching and creating.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-xl bg-white text-[#05070D] hover:bg-zinc-200 text-[13.5px] font-bold shadow-sm transition-all active:scale-95 shrink-0"
          >
            <Plus size={15} weight="bold" /> New project
          </button>
        </div>

        {/* ── ADVANCED DSRT TABS (Blue) ──────────────────── */}
        <div className="border-b border-white/[0.08] mb-8">
          <div className="flex gap-2 sm:gap-6 -mb-px overflow-x-auto scrollbar-hide px-1">
            {TABS.map(tab => {
              const active = activeTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={cn(
                    'flex flex-col items-center gap-2.5 pb-3 min-w-[80px] transition-all border-b-[3px] outline-none',
                    active ? 'border-[#38bdf8]' : 'border-transparent hover:border-white/20'
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                    active 
                      ? "bg-gradient-to-br from-[#38bdf8]/20 to-[#2563eb]/10 border border-[#38bdf8]/30 shadow-[0_0_20px_rgba(56,189,248,0.15)]" 
                      : "bg-white/[0.02] border border-white/[0.05] group-hover:bg-white/[0.05]"
                  )}>
                    <Icon className={cn("w-6 h-6", active ? "text-[#38bdf8]" : "text-zinc-500")} />
                  </div>
                  <span className={cn(
                    "text-[12px] sm:text-[13px] whitespace-nowrap transition-all", 
                    active ? "text-white font-bold tracking-wide" : "text-zinc-500 font-semibold"
                  )}>
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── DRAFT LIMIT WARNING BANNER ─────────────────── */}
        {draftLimitInfo && draftLimitInfo.count >= 8 && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between ${
            draftLimitInfo.count >= draftLimitInfo.limit
              ? 'bg-[#1a0f0f] border-red-500/20'
              : 'bg-white/[0.03] border-white/[0.08]'
          }`}>
            <div className="flex items-center gap-3">
              <WarningCircle size={18} className={draftLimitInfo.count >= draftLimitInfo.limit ? 'text-red-400' : 'text-white/60'} />
              <p className="text-[13px] text-white/80 font-medium">
                {draftLimitInfo.count >= draftLimitInfo.limit ? (
                  <><strong className="text-white">Draft limit reached ({draftLimitInfo.count}/{draftLimitInfo.limit}).</strong> Publish or delete an existing draft to create new ones.</>
                ) : (
                  <>You have <strong className="text-white">{draftLimitInfo.count} of {draftLimitInfo.limit}</strong> active draft projects.</>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ── MY PROJECTS TAB ───────────────────────────── */}
        {activeTab === 'my-projects' && (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 lg:gap-10 items-start w-full">
            
            {/* LEFT RAIL - SOLID GRADIENT PANELS */}
            <div className="hidden lg:flex flex-col gap-5 sticky top-[24px]">
              <InfoPanel
                title="BUILD IN PUBLIC"
                icon={Lightbulb}
                text="Your project profile is a public record of what you're building, learning and shipping. Keep it specific, well-documented and current — people evaluating collaborators notice details quickly."
                linkText="Learn how to present your project"
                linkHref="/resources"
              />
              <InfoPanel
                title="DISCOVERABILITY"
                icon={ShieldCheck}
                text="A complete project profile can appear across DSRT Connect where relevant. Your project may be surfaced to people based on domains, technologies, stage and activity."
                linkText="Manage visibility"
                linkHref="/settings"
              />
              <ServicesPanel />
              <InfoPanel
                title="COLLABORATION"
                icon={Users}
                text="Open your project to collaborators when you're ready. Post open roles from your project page directly to DSRT Looking For — one canonical opportunity system."
                linkText="Find collaborators"
                linkHref="/looking-for"
              />
            </div>

            {/* RIGHT WORKSPACE */}
            <div className="min-w-0 w-full flex flex-col gap-8">
              
              {/* Drafts carousel */}
              {drafts.length > 0 && (
                <section className="w-full min-w-0">
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <h2 className="text-[16px] font-bold text-white flex items-center gap-2">
                        Work in progress
                        <span className="text-[11px] text-white/40 font-semibold bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-full">
                          Unpublished · {drafts.length}
                        </span>
                      </h2>
                    </div>
                  </div>
                  <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 md:-mx-0 px-4 md:px-0">
                    {drafts.map(d => (
                      <ProjectDraftCard key={d.id} project={d} />
                    ))}
                  </div>
                </section>
              )}

              {/* Header: Title + Filters + Sort */}
              <section className="flex flex-col gap-6 w-full min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-[18px] font-bold text-white tracking-tight">Your projects</h2>
                    <p className="text-[13px] text-zinc-400 mt-0.5 font-medium">Manage everything you're actively building.</p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center p-1 bg-[#121215] border border-white/[0.08] rounded-xl shadow-inner overflow-x-auto">
                      {(['all', 'active', 'completed', 'archived'] as QuickStatus[]).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setQuickStatus(tab)}
                          className={cn(
                            "px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                            quickStatus === tab 
                              ? 'bg-white/[0.08] text-white shadow-sm' 
                              : 'text-zinc-500 hover:text-white'
                          )}
                        >
                          <span className="capitalize">{tab}</span>
                          {statusCounts[tab] > 0 && (
                            <span className={cn("text-[10px] font-mono", quickStatus === tab ? 'text-zinc-400' : 'text-zinc-600')}>
                              {statusCounts[tab]}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="relative shrink-0">
                      <button
                        onClick={() => setSortOpen(!sortOpen)}
                        className="flex items-center gap-1.5 text-[12px] font-bold text-zinc-400 hover:text-white bg-[#121215] border border-white/[0.08] px-3.5 py-2 rounded-xl transition-colors h-full"
                      >
                        Sort by: <span className="text-white capitalize">{sortOption.replace('-', ' ')}</span>
                        <CaretDown size={12} weight="bold" />
                      </button>

                      {sortOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                          <div className="absolute right-0 top-full mt-2 w-48 bg-[#0d0d10] border border-white/[0.08] rounded-xl shadow-2xl z-20 py-1.5">
                            {[
                              { id: 'updated', label: 'Last updated' },
                              { id: 'created', label: 'Recently created' },
                              { id: 'name', label: 'Name (A–Z)' },
                              { id: 'stage', label: 'Stage' },
                            ].map(opt => (
                              <button
                                key={opt.id}
                                onClick={() => { setSortOption(opt.id as SortOption); setSortOpen(false); }}
                                className={cn(
                                  "w-full text-left px-4 py-2.5 text-[12.5px] transition-colors",
                                  sortOption === opt.id ? "bg-white/[0.06] text-white font-bold" : "text-zinc-400 hover:text-white hover:bg-white/[0.03] font-medium"
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* State Machine */}
                {loading ? (
                  <div className="space-y-4 w-full">
                    {[1, 2].map(i => (
                      <div key={i} className="h-[180px] rounded-2xl bg-[#121215] border border-white/[0.04] p-5 animate-pulse flex gap-5 w-full">
                        <div className="w-[200px] h-[120px] rounded-xl bg-white/[0.03]" />
                        <div className="flex-1 space-y-3 py-1">
                          <div className="h-5 w-1/3 bg-white/[0.03] rounded" />
                          <div className="h-4 w-1/4 bg-white/[0.03] rounded" />
                          <div className="h-10 w-full bg-white/[0.03] rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-2xl text-center space-y-3 w-full">
                    <WarningCircle size={28} className="text-red-400 mx-auto" />
                    <h3 className="text-[16px] font-bold text-white">Unable to load your projects</h3>
                    <p className="text-[13px] text-zinc-400 max-w-sm mx-auto">
                      Something went wrong while retrieving your project workspace.
                    </p>
                    <button onClick={loadWorkspaceData} className="px-5 py-2.5 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white rounded-xl text-[13px] font-bold transition-colors">
                      Try again
                    </button>
                  </div>
                ) : filteredByStatus.length === 0 ? (
                  quickStatus === 'all' ? (
                    <div className="p-12 border border-white/[0.06] rounded-2xl bg-[#121215]/50 text-center space-y-4 shadow-inner w-full">
                      <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto border border-white/[0.05]">
                        <Wrench size={32} className="text-zinc-500" />
                      </div>
                      <div>
                        <h3 className="text-[16px] font-bold text-white">You haven't created a project yet.</h3>
                        <p className="text-[13.5px] text-zinc-500 max-w-sm mx-auto mt-1">Build something worth sharing.</p>
                      </div>
                      <button onClick={() => setCreateModalOpen(true)} className="mt-2 inline-flex items-center gap-1.5 h-11 px-6 rounded-xl bg-white text-[#05070D] hover:bg-zinc-200 text-[13.5px] font-bold transition-colors">
                        <Plus size={16} weight="bold" /> Create your first project
                      </button>
                    </div>
                  ) : (
                    <div className="p-12 border border-white/[0.06] rounded-2xl bg-[#121215]/50 text-center space-y-3 w-full">
                      <Wrench size={32} className="text-zinc-600 mx-auto" />
                      <p className="text-[14px] text-zinc-400 font-bold">No {quickStatus} projects.</p>
                      <button onClick={() => setQuickStatus('all')} className="text-[13px] font-bold text-zinc-500 hover:text-white underline underline-offset-4">
                        View all projects
                      </button>
                    </div>
                  )
                ) : (
                  <div className="space-y-10 w-full min-w-0">
                    <ProjectSectionRow title="Actively building" subtitle="Projects moving forward" projects={sections.actively_building} onDeleteRequest={setDeleteModalProject} />
                    <ProjectSectionRow title="Recently updated" subtitle="Last two weeks" projects={sections.recently_updated} onDeleteRequest={setDeleteModalProject} />
                    <ProjectSectionRow title="Research & experiments" subtitle="Learning and technical exploration" projects={sections.research_and_experiments} onDeleteRequest={setDeleteModalProject} />
                    <ProjectSectionRow title="Open source" subtitle="Publicly available and open for contribution" projects={sections.open_source} onDeleteRequest={setDeleteModalProject} />
                    <ProjectSectionRow title="Other projects" subtitle="" projects={sections.other} onDeleteRequest={setDeleteModalProject} />
                  </div>
                )}
              </section>

              {/* Mobile Info Panels appear at the bottom on small screens */}
              <div className="flex lg:hidden flex-col gap-5 mt-8 w-full">
                <InfoPanel
                  title="BUILD IN PUBLIC"
                  icon={Lightbulb}
                  text="Your project profile is a public record of what you're building, learning and shipping. Keep it specific, well-documented and current — people evaluating collaborators notice details quickly."
                  linkText="Learn how to present your project"
                  linkHref="/resources"
                />
                <InfoPanel
                  title="DISCOVERABILITY"
                  icon={ShieldCheck}
                  text="A complete project profile can appear across DSRT Connect where relevant. Your project may be surfaced to people based on domains, technologies, stage and activity."
                  linkText="Manage visibility"
                  linkHref="/settings"
                />
                <ServicesPanel />
              </div>
            </div>
          </div>
        )}

        {/* ── EXPLORE TAB ──────────────────────────────── */}
        {activeTab === 'explore' && <div className="pt-2"><ProjectExplorePage /></div>}

        {/* ── FOLLOWING TAB ────────────────────────────── */}
        {activeTab === 'following' && (
          <div>
            {followingProjects.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/[0.1] p-16 text-center bg-[#121215]/50 max-w-4xl mx-auto">
                <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto border border-white/[0.05] mb-5">
                  <Heart size={32} className="text-zinc-500" />
                </div>
                <h3 className="text-[18px] font-bold text-white mb-2">Not following any projects</h3>
                <p className="text-[13.5px] text-zinc-500 mb-6 max-w-md mx-auto">Follow projects in Explore to track their builds and updates in your feed.</p>
                <button onClick={() => setActiveTab('explore')} className="inline-flex items-center h-11 px-6 rounded-xl bg-white text-[#05070D] hover:bg-zinc-200 text-[13.5px] font-bold transition-colors">
                  Explore projects
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl">
                {followingProjects.map(p => (
                  <ProjectHorizontalCard key={p.id} project={p} onDeleteRequest={setDeleteModalProject} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── APPLICATIONS TAB ─────────────────────────── */}
        {activeTab === 'applications' && (
          <div className="rounded-3xl border border-dashed border-white/[0.1] p-16 text-center bg-[#121215]/50 max-w-4xl mx-auto">
            <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto border border-white/[0.05] mb-5">
              <Briefcase size={32} className="text-zinc-500" />
            </div>
            <h3 className="text-[18px] font-bold text-white mb-2">Applications & role activity</h3>
            <p className="text-[13.5px] text-zinc-500 max-w-md mx-auto mb-6">
              Applications submitted to project roles or received by your projects are managed via canonical Looking For opportunities.
            </p>
            <Link href="/looking-for" className="inline-flex items-center h-11 px-6 rounded-xl bg-white text-[#05070D] hover:bg-zinc-200 text-[13.5px] font-bold transition-colors">
              Open Looking For
            </Link>
          </div>
        )}

        {/* Technical Marquee */}
        {activeTab !== 'explore' && <ProjectTechnicalMarquee resources={resources} />}

        {/* Footer */}
        <footer className="mt-24 pt-12 border-t border-white/[0.08] text-[12px] text-zinc-500 w-full">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} DSRT Connect. All rights reserved.</p>
            <p className="font-mono text-[11px]">BERLIN · SAN FRANCISCO · BENGALURU</p>
          </div>
        </footer>

      </div>

      {/* Delete modal */}
      {deleteModalProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setDeleteModalProject(null)}>
          <div className="bg-[#121215] border border-white/[0.1] rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-[18px] font-bold text-white">Archive project?</h3>
            <p className="text-[13.5px] text-zinc-400 leading-relaxed">
              This will archive <strong className="text-white">{deleteModalProject.name}</strong>. Archived projects are hidden from Explore but remain accessible in your Archive tab. You can restore them later.
            </p>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-bold mb-2">
                Type "{deleteModalProject.name}" to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={e => setDeleteConfirmInput(e.target.value)}
                placeholder={deleteModalProject.name}
                className="w-full h-11 px-4 bg-[#09090b] border border-white/[0.1] rounded-xl text-[13.5px] font-medium text-white focus:outline-none focus:border-white/[0.2] transition-colors"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setDeleteModalProject(null); setDeleteConfirmInput('') }} disabled={deleting} className="px-5 h-10 text-[13.5px] font-bold text-zinc-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirmDelete} disabled={deleting || deleteConfirmInput.trim() !== deleteModalProject.name.trim()} className="px-5 h-10 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-[13.5px] disabled:opacity-50 transition-colors flex items-center gap-2">
                {deleting ? <><CircleNotch size={14} className="animate-spin" /> Archiving</> : 'Archive project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal 
        open={createModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
      />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   SOLID GRADIENT INFO PANELS (Light Blue/Sky)
────────────────────────────────────────────────────────────── */

function InfoPanel({ title, text, linkText, linkHref, icon: Icon }: any) {
  return (
    <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[#38bdf8] to-[#2563eb] shadow-[0_8px_30px_rgba(59,130,246,0.15)] overflow-hidden w-full">
      <div className="absolute inset-x-0 top-0 h-px bg-white/40 pointer-events-none" />
      
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-black/10 flex items-center justify-center border border-black/5 shadow-inner">
          <Icon size={16} weight="fill" className="text-[#05070D]" />
        </div>
        <p className="text-[11.5px] font-mono uppercase tracking-widest text-[#05070D] font-bold">
          {title}
        </p>
      </div>
      
      <p className="text-[13.5px] text-[#05070D]/90 leading-relaxed mb-5 font-semibold">{text}</p>
      
      <Link href={linkHref} className="text-[13px] font-extrabold text-[#05070D] hover:text-black flex items-center gap-1 group w-fit">
        {linkText}
        <ArrowRight size={12} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  )
}

function ServicesPanel() {
  return (
    <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[#38bdf8] to-[#2563eb] shadow-[0_8px_30px_rgba(59,130,246,0.15)] overflow-hidden w-full space-y-4">
      <div className="absolute inset-x-0 top-0 h-px bg-white/40 pointer-events-none" />
      
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-lg bg-black/10 flex items-center justify-center border border-black/5 shadow-inner">
          <SquaresFour size={16} weight="fill" className="text-[#05070D]" />
        </div>
        <p className="text-[11.5px] font-mono uppercase tracking-widest text-[#05070D] font-bold">
          DSRT CONNECT SERVICES
        </p>
      </div>
      
      <p className="text-[13.5px] text-[#05070D]/90 leading-relaxed font-semibold">
        Use the wider DSRT ecosystem to build, ship and grow your projects.
      </p>

      <div className="space-y-3 pt-2">
        <Link href="/looking-for" className="block group">
          <p className="text-[13px] font-extrabold text-[#05070D] group-hover:text-black flex items-center gap-1">Looking For <ArrowRight size={10} weight="bold" className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all"/></p>
          <p className="text-[11.5px] text-[#05070D]/70 font-medium">Find collaborators and contributors.</p>
        </Link>
        <Link href="/ventures" className="block group">
          <p className="text-[13px] font-extrabold text-[#05070D] group-hover:text-black flex items-center gap-1">Ventures <ArrowRight size={10} weight="bold" className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all"/></p>
          <p className="text-[11.5px] text-[#05070D]/70 font-medium">Turn a strong project into a full venture.</p>
        </Link>
        <Link href="/inbox" className="block group">
          <p className="text-[13px] font-extrabold text-[#05070D] group-hover:text-black flex items-center gap-1">DSRT Mail <ArrowRight size={10} weight="bold" className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all"/></p>
          <p className="text-[11.5px] text-[#05070D]/70 font-medium">Communicate with collaborators.</p>
        </Link>
        <Link href="/coco" className="block group">
          <p className="text-[13px] font-extrabold text-[#05070D] group-hover:text-black flex items-center gap-1">COCO <ArrowRight size={10} weight="bold" className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all"/></p>
          <p className="text-[11.5px] text-[#05070D]/70 font-medium">Plan, research and work across projects.</p>
        </Link>
      </div>

      <div className="pt-4 mt-2 border-t border-black/10">
        <Link href="/community" className="text-[13px] font-extrabold text-[#05070D] hover:text-black flex items-center gap-1 group w-fit">
          Explore communities
          <ArrowRight size={12} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  )
}

function ProjectHorizontalCard({ project, onDeleteRequest }: { project: Project; onDeleteRequest: (v: Project) => void }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleCardClick = () => router.push(`/projects/${project.slug}`)

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(`${window.location.origin}/projects/${project.slug}`)
    toast.success('Project link copied')
    setMenuOpen(false)
  }

  const domainTags = (project.category || [project.industry].filter(Boolean) as string[])
  const techTags = (project.tech_stack || [])

  return (
    <div onClick={handleCardClick} className="group relative bg-[#121215] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-5 flex flex-col md:flex-row gap-6 cursor-pointer transition-all shadow-sm w-full min-w-0">
      <div className="w-full md:w-[220px] h-[160px] md:h-[140px] rounded-xl bg-[#09090b] border border-white/[0.06] overflow-hidden flex-shrink-0 relative">
        {project.cover_image_url ? (
          <img src={project.cover_image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900/40"><Wrench size={32} className="text-zinc-800" /></div>
        )}
        {project.logo_url && (
          <div className="absolute bottom-3 left-3 w-12 h-12 rounded-xl border border-white/[0.1] shadow-lg bg-[#09090b] overflow-hidden">
            <img src={project.logo_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 w-full">
        <div className="w-full">
          <div className="flex items-start justify-between gap-4 mb-2 w-full">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[18px] font-bold text-white truncate group-hover:text-[#38bdf8] transition-colors tracking-tight">{project.name}</h3>
                {project.is_dsrt_verified && <CheckCircle size={15} weight="fill" className="text-[#38bdf8] shrink-0" />}
              </div>
              {(project.tagline || project.short_description) && (
                <p className="text-[13.5px] text-zinc-400 truncate">{project.tagline || project.short_description}</p>
              )}
            </div>

            <div className="relative shrink-0">
              <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }} className="w-8 h-8 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors">
                <DotsThree size={24} weight="bold" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
                  <div className="absolute right-0 top-full mt-2 z-40 w-48 bg-[#0d0d10] border border-white/[0.08] rounded-xl shadow-2xl p-1.5 space-y-0.5">
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.slug}`) }} className="w-full text-left px-3.5 py-2 text-[13px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">Open project</button>
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.slug}?tab=settings`) }} className="w-full text-left px-3.5 py-2 text-[13px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">Edit project</button>
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.slug}?tab=team`) }} className="w-full text-left px-3.5 py-2 text-[13px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">Manage team</button>
                    <button onClick={handleCopyLink} className="w-full text-left px-3.5 py-2 text-[13px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">Share project</button>
                    <div className="h-px bg-white/[0.06] my-1" />
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDeleteRequest(project) }} className="w-full text-left px-3.5 py-2 text-[13px] font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">Archive project</button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-3">
            {domainTags.slice(0, 2).map((d, i) => (
              <span key={i} className="px-2.5 py-1 bg-white/[0.03] border border-white/[0.05] text-zinc-300 text-[11px] rounded-md font-semibold tracking-wide">{d}</span>
            ))}
            {project.stage && <span className="px-2.5 py-1 bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8] text-[11px] rounded-md font-bold uppercase tracking-wider">{project.stage}</span>}
            {project.location && <span className="flex items-center gap-1 text-[11.5px] font-medium text-zinc-500 ml-2"><MapPin size={12} /> {project.location}</span>}
          </div>

          {techTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {techTags.slice(0, 4).map((t, i) => (
                <span key={i} className="px-2 py-1 text-[10.5px] font-mono font-medium text-zinc-400 bg-[#09090b] border border-white/[0.04] rounded-md">{t}</span>
              ))}
              {techTags.length > 4 && <span className="text-[10.5px] text-zinc-600 font-mono font-medium ml-1">+{techTags.length - 4}</span>}
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-white/[0.04] flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-5 text-[12px] text-zinc-500 font-mono font-medium">
            <span className="flex items-center gap-1.5"><Users size={14}/> {project.team_size || 1}</span>
            {project.is_open_source && <span className="flex items-center gap-1.5"><GitBranch size={14} /> OSS</span>}
          </div>
          <button onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.slug}`) }} className="h-9 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[12.5px] font-bold text-white transition-colors">
            Open project
          </button>
        </div>
      </div>
    </div>
  )
}

function ProjectDraftCard({ project }: { project: Project }) {
  const router = useRouter()
  return (
    <div onClick={() => router.push(`/projects/create?continue=${project.slug}`)} className="w-[260px] flex-shrink-0 bg-[#121215] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/20 transition-all cursor-pointer group shadow-sm">
      <div className="relative h-[110px] overflow-hidden bg-zinc-900/60 border-b border-white/[0.04]">
        {project.cover_image_url ? (
          <img src={project.cover_image_url} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Wrench size={26} className="text-white/10" /></div>
        )}
        <span className="absolute top-3 left-3 text-[9px] font-extrabold text-black bg-white px-2 py-1 rounded-md uppercase tracking-widest shadow-sm">
          Draft
        </span>
      </div>
      <div className="p-5">
        <h4 className="text-[14.5px] font-bold text-white truncate mb-1">{project.name}</h4>
        {project.project_number && (
          <p className="text-[11px] text-zinc-500 font-mono font-medium mb-3">{project.project_number}</p>
        )}
        <p className="text-[11px] text-zinc-500 mb-4 font-medium">
          Edited {timeAgo(project.updated_at || project.created_at)}
        </p>
        <button className="w-full flex items-center justify-center gap-1.5 text-[12.5px] font-bold text-zinc-300 bg-white/[0.04] border border-white/[0.06] group-hover:bg-white group-hover:text-[#05070D] px-3 h-10 rounded-xl transition-colors">
          Continue building <ArrowRight size={12} weight="bold" />
        </button>
      </div>
    </div>
  )
}

function ProjectSectionRow({ title, subtitle, projects, onDeleteRequest }: any) {
  if (projects.length === 0) return null
  return (
    <section className="space-y-4 w-full min-w-0">
      <div>
        <h2 className="text-[18px] font-bold text-white flex items-center gap-2.5">
          {title} 
          <span className="text-[12px] font-semibold text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">{projects.length}</span>
        </h2>
        {subtitle && <p className="text-[13.5px] font-medium text-zinc-500 mt-1">{subtitle}</p>}
      </div>
      <div className="flex flex-col items-stretch w-full gap-4">
        {projects.map((p: any) => <ProjectHorizontalCard key={p.id} project={p} onDeleteRequest={onDeleteRequest} />)}
      </div>
    </section>
  )
}

function ProjectTechnicalMarquee({ resources }: { resources: any[] }) {
  const [isPaused, setIsPaused] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/projects/resources/save')
      .then(r => r.json())
      .then(d => setSavedIds(new Set(d.saved || [])))
      .catch(() => {})
  }, [])

  const handleToggleSave = async (resourceId: string, wasSaved: boolean) => {
    setSavedIds(prev => {
      const next = new Set(prev)
      if (wasSaved) next.delete(resourceId)
      else next.add(resourceId)
      return next
    })

    try {
      await fetch('/api/projects/resources/save', {
        method: wasSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource_id: resourceId })
      })
      toast.success(wasSaved ? 'Removed from saved' : 'Saved to your technical library')
    } catch {
      setSavedIds(prev => {
        const next = new Set(prev)
        if (wasSaved) next.add(resourceId)
        else next.delete(resourceId)
        return next
      })
      toast.error('Could not update saved status')
    }
  }

  if (resources.length === 0) return null
  const duplicated = [...resources, ...resources, ...resources]

  return (
    <div className="mt-20 pt-12 border-t border-white/[0.08] w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#121215] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
            <Wrench size={20} weight="fill" className="text-zinc-400" />
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-white tracking-tight">DSRT Technical Library</h2>
            <p className="text-[14px] text-zinc-500 mt-1 font-medium">
              Engineering essays, system design guides, and hidden gems for builders.
            </p>
          </div>
        </div>
        <Link
          href="/resources"
          className="text-[13.5px] font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors shrink-0"
        >
          Explore library <ArrowRight size={12} weight="bold" />
        </Link>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl w-full"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-[#05070D] to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-[#05070D] to-transparent pointer-events-none" />

        <div
          className="flex gap-5 py-2"
          style={{
            animation: `marquee-projects-scroll ${resources.length * 8}s linear infinite`,
            animationPlayState: isPaused ? 'paused' : 'running',
            width: 'fit-content',
          }}
        >
          {duplicated.map((item, idx) => {
            const isSaved = savedIds.has(item.id)
            return (
              <a
                key={`${item.id}-${idx}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex-shrink-0 w-[320px] p-6 bg-[#121215] border border-white/[0.06] hover:border-white/[0.16] rounded-2xl transition-all block relative"
              >
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleToggleSave(item.id, isSaved)
                  }}
                  className={`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isSaved
                      ? 'bg-white/[0.08] text-white'
                      : 'bg-transparent text-zinc-600 hover:bg-white/[0.06] hover:text-white'
                  }`}
                  aria-label={isSaved ? 'Remove from saved' : 'Save'}
                >
                  <BookmarkSimple size={15} weight={isSaved ? 'fill' : 'regular'} />
                </button>

                <div className="flex items-center gap-2.5 mb-4 pr-10">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold flex-1 truncate">
                    {item.category}
                  </p>
                  {item.is_hidden_gem && (
                    <Star size={13} weight="fill" className="text-zinc-400 shrink-0" />
                  )}
                </div>

                <p className="text-[15px] font-bold text-white group-hover:text-[#38bdf8] transition-colors leading-snug mb-3 line-clamp-2 min-h-[44px]">
                  {item.title}
                </p>

                {item.description && (
                  <p className="text-[12.5px] text-zinc-500 leading-relaxed line-clamp-2 mb-4 font-medium min-h-[36px]">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/[0.04]">
                  <p className="text-[12px] text-zinc-400 font-bold truncate">
                    {item.provider}
                  </p>
                  <ArrowSquareOut size={13} className="text-zinc-600 group-hover:text-white transition-colors" weight="bold" />
                </div>
              </a>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee-projects-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  )
}