'use client'

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// Explore page
import { ProjectExplorePage } from '@/components/projects-explore/ProjectExplorePage'

import {
  Plus, FolderSimple, Compass, Heart, Briefcase,
  Users, ArrowRight, CircleNotch, CaretDown, WarningCircle,
  DotsThree, MapPin, ArrowSquareOut, Star, BookmarkSimple,
  Wrench, GitBranch, CheckCircle
} from '@phosphor-icons/react'
import { toast } from 'sonner'

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

const TABS = [
  { id: 'my-projects', label: 'My Projects', icon: FolderSimple },
  { id: 'explore',     label: 'Explore',     icon: Compass },
  { id: 'following',   label: 'Following',   icon: Heart },
  { id: 'applications', label: 'Applications', icon: Briefcase },
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
    <div className="flex-1 min-h-screen bg-[#09090b] text-white pb-24 font-sans">
      <div className="max-w-[1240px] mx-auto px-4 md:px-6 pt-8">

        {/* ── HEADER ────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-white leading-snug">
              {greeting()},{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                {firstName}
              </span>.
            </h1>
            <p className="text-[13.5px] text-zinc-400 mt-1">
              Everything you're building, experimenting with, researching and creating.
            </p>
          </div>

          <button
            onClick={() => router.push('/projects/create')}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-white text-black hover:bg-zinc-200 text-[13px] font-bold shadow-sm transition-all active:scale-95 shrink-0"
          >
            <Plus size={14} weight="bold" /> New project
          </button>
        </div>

        {/* ── DRAFT LIMIT WARNING BANNER ─────────────────── */}
        {draftLimitInfo && draftLimitInfo.count >= 8 && (
          <div className={`mb-6 p-3.5 rounded-lg border flex items-center justify-between ${
            draftLimitInfo.count >= draftLimitInfo.limit
              ? 'bg-[#1a0f0f] border-red-500/20'
              : 'bg-white/[0.03] border-white/[0.08]'
          }`}>
            <div className="flex items-center gap-2.5">
              <WarningCircle size={16} className={draftLimitInfo.count >= draftLimitInfo.limit ? 'text-red-400' : 'text-white/60'} />
              <p className="text-[13px] text-white/80">
                {draftLimitInfo.count >= draftLimitInfo.limit ? (
                  <><strong className="text-white">Draft limit reached ({draftLimitInfo.count}/{draftLimitInfo.limit}).</strong> Publish or delete an existing draft to create new ones.</>
                ) : (
                  <>You have <strong className="text-white">{draftLimitInfo.count} of {draftLimitInfo.limit}</strong> active draft projects.</>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ── TABS ──────────────────────────────────────── */}
        <div className="border-b border-white/[0.08] mb-8">
          <div className="flex gap-6 -mb-px overflow-x-auto scrollbar-hide">
            {TABS.map(tab => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={
                    'pb-3 text-[13.5px] font-medium transition-colors border-b-2 whitespace-nowrap ' +
                    (active
                      ? 'text-white border-white font-semibold'
                      : 'text-zinc-500 border-transparent hover:text-zinc-300')
                  }
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── MY PROJECTS TAB ───────────────────────────── */}
        {activeTab === 'my-projects' && (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
            
            {/* LEFT RAIL */}
            <div className="space-y-4">
              <InfoPanel
                title="BUILD IN PUBLIC"
                text="Your project profile is a public record of what you're building, learning and shipping. Keep it specific, well-documented and current — people evaluating collaborators or hiring notice details quickly."
                linkText="Learn how to present your project →"
                linkHref="/resources"
              />
              <InfoPanel
                title="DISCOVERABILITY"
                text="A complete project profile can appear across DSRT Connect where relevant. Your project may be surfaced to people based on domains, technologies, stage and activity."
                linkText="Manage visibility →"
                linkHref="/settings"
              />
              <ServicesPanel />
              <InfoPanel
                title="COLLABORATION"
                text="Open your project to collaborators when you're ready. Post open roles from your project page directly to DSRT Looking For — one canonical opportunity system."
                linkText="Find collaborators →"
                linkHref="/looking-for"
              />
              <div className="p-5 border border-white/[0.04] rounded-xl bg-[#0d0d10]">
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">BUILDER NOTE</p>
                <p className="text-[12.5px] text-zinc-400 leading-relaxed italic">
                  "A strong project isn't about polish. It's about clarity — what you're building, why it matters, and what you're learning as you go."
                </p>
              </div>
            </div>

            {/* RIGHT WORKSPACE */}
            <div className="min-w-0">
              {/* Start-a-new-project card */}
              <div className="bg-[#121215] border border-white/[0.06] rounded-2xl p-8 mb-8 flex flex-col items-center text-center shadow-sm">
                <h2 className="text-[18px] font-bold text-white mb-2">Start a new project</h2>
                <p className="text-[13.5px] text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
                  Turn your ideas, experiments, or technical work into a project others can discover, follow, or contribute to.
                </p>
                <button
                  onClick={() => router.push('/projects/create')}
                  className="flex items-center gap-1.5 h-10 px-5 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white font-semibold text-[13px] transition-colors"
                >
                  <Plus size={14} weight="bold" /> Start your project
                </button>
              </div>

              {/* Drafts carousel with route parameter support */}
              {drafts.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
                        Work in progress
                        <span className="text-[11px] text-white/40 font-normal bg-white/[0.05] border border-white/[0.06] px-2 py-0.5 rounded-full">
                          Unpublished · {drafts.length}
                        </span>
                      </h2>
                    </div>
                  </div>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 md:-mx-6 px-4 md:px-6">
                    {drafts.map(d => (
                      <ProjectDraftCard key={d.id} project={d} />
                    ))}
                  </div>
                </section>
              )}

              {/* Header: Title + Filters + Sort */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-[16px] font-bold text-white">Your projects</h2>
                  <p className="text-[12.5px] text-zinc-500 mt-0.5">Manage everything you're actively building.</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-[#0d0d10] border border-white/[0.06] rounded-lg w-fit">
                    {(['all', 'active', 'completed', 'archived'] as QuickStatus[]).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setQuickStatus(tab)}
                        className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors flex items-center gap-1.5 ${
                          quickStatus === tab ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <span className="capitalize">{tab}</span>
                        {statusCounts[tab] > 0 && (
                          <span className={`text-[10px] font-mono ${quickStatus === tab ? 'text-zinc-300' : 'text-zinc-600'}`}>
                            {statusCounts[tab]}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setSortOpen(!sortOpen)}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-400 hover:text-white bg-[#121215] border border-white/[0.06] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Sort by: <span className="text-white capitalize">{sortOption.replace('-', ' ')}</span>
                      <CaretDown size={12} weight="bold" />
                    </button>

                    {sortOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-44 bg-[#0d0d10] border border-white/[0.08] rounded-xl shadow-2xl z-20 py-1">
                          {[
                            { id: 'updated', label: 'Last updated' },
                            { id: 'created', label: 'Recently created' },
                            { id: 'name', label: 'Name (A–Z)' },
                            { id: 'stage', label: 'Stage' },
                          ].map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => { setSortOption(opt.id as SortOption); setSortOpen(false); }}
                              className={`w-full text-left px-3.5 py-2 text-[12px] transition-colors ${
                                sortOption === opt.id ? 'bg-white/[0.06] text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                              }`}
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
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-[180px] rounded-2xl bg-[#121215] border border-white/[0.04] p-5 animate-pulse flex gap-5">
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
                <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-2xl text-center space-y-3">
                  <WarningCircle size={24} className="text-red-400 mx-auto" />
                  <h3 className="text-[15px] font-bold text-white">Unable to load your projects</h3>
                  <p className="text-[12.5px] text-zinc-400 max-w-sm mx-auto">
                    Something went wrong while retrieving your project workspace.
                  </p>
                  <button onClick={loadWorkspaceData} className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white rounded-lg text-[12.5px] font-semibold transition-colors">
                    Try again
                  </button>
                </div>
              ) : filteredByStatus.length === 0 ? (
                quickStatus === 'all' ? (
                  <div className="p-12 border border-white/[0.06] rounded-2xl bg-[#121215]/50 text-center space-y-3">
                    <Wrench size={32} className="text-zinc-600 mx-auto" />
                    <h3 className="text-[15px] font-bold text-white">You haven't created a project yet.</h3>
                    <p className="text-[13px] text-zinc-500 max-w-sm mx-auto">Build something worth sharing.</p>
                    <button onClick={() => router.push('/projects/create')} className="mt-2 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white text-black hover:bg-zinc-200 text-[13px] font-bold transition-colors">
                      <Plus size={14} weight="bold" /> Create your first project
                    </button>
                  </div>
                ) : (
                  <div className="p-10 border border-white/[0.06] rounded-2xl bg-[#121215]/50 text-center space-y-3">
                    <Wrench size={28} className="text-zinc-600 mx-auto" />
                    <p className="text-[13.5px] text-zinc-400 font-semibold">No {quickStatus} projects.</p>
                    <button onClick={() => setQuickStatus('all')} className="text-[12px] font-semibold text-zinc-400 hover:text-white underline underline-offset-2">
                      View all projects
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-10">
                  <ProjectSectionRow title="Actively building" subtitle="Projects moving forward" projects={sections.actively_building} onDeleteRequest={setDeleteModalProject} />
                  <ProjectSectionRow title="Recently updated" subtitle="Last two weeks" projects={sections.recently_updated} onDeleteRequest={setDeleteModalProject} />
                  <ProjectSectionRow title="Research & experiments" subtitle="Learning and technical exploration" projects={sections.research_and_experiments} onDeleteRequest={setDeleteModalProject} />
                  <ProjectSectionRow title="Open source" subtitle="Publicly available and open for contribution" projects={sections.open_source} onDeleteRequest={setDeleteModalProject} />
                  <ProjectSectionRow title="Other projects" subtitle="" projects={sections.other} onDeleteRequest={setDeleteModalProject} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EXPLORE TAB ──────────────────────────────── */}
        {activeTab === 'explore' && <div className="pt-2"><ProjectExplorePage /></div>}

        {/* ── FOLLOWING TAB ────────────────────────────── */}
        {activeTab === 'following' && (
          <div>
            {followingProjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.1] p-12 text-center bg-[#121215]/50">
                <Heart size={28} className="mx-auto mb-3 text-zinc-600" />
                <p className="text-[14px] font-bold text-white mb-1">Not following any projects</p>
                <p className="text-[12.5px] text-zinc-500 mb-4">Follow projects in Explore to track their builds and updates.</p>
                <button onClick={() => setActiveTab('explore')} className="inline-flex items-center h-9 px-4 rounded-lg bg-white text-black hover:bg-zinc-200 text-[13px] font-bold transition-colors">
                  Explore projects
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {followingProjects.map(p => (
                  <ProjectHorizontalCard key={p.id} project={p} onDeleteRequest={setDeleteModalProject} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── APPLICATIONS TAB ─────────────────────────── */}
        {activeTab === 'applications' && (
          <div className="rounded-2xl border border-dashed border-white/[0.1] p-12 text-center bg-[#121215]/50">
            <Briefcase size={28} className="mx-auto mb-3 text-zinc-600" />
            <p className="text-[14px] font-bold text-white mb-1">Applications & role activity</p>
            <p className="text-[12.5px] text-zinc-500 max-w-sm mx-auto mb-4">
              Applications submitted to project roles or received by your projects are managed via canonical Looking For opportunities.
            </p>
            <Link href="/looking-for" className="inline-flex items-center h-9 px-4 rounded-lg bg-white text-black hover:bg-zinc-200 text-[13px] font-bold transition-colors">
              Open Looking For
            </Link>
          </div>
        )}

        {/* Technical Marquee */}
        {activeTab !== 'explore' && <ProjectTechnicalMarquee resources={resources} />}

        {/* Footer */}
        <footer className="mt-24 pt-12 border-t border-white/[0.08] text-[12px] text-zinc-500">
          <div className="flex items-center justify-between">
            <p>© 2026 DSRT Connect. All rights reserved.</p>
            <p className="font-mono text-[11px]">BERLIN · SAN FRANCISCO · BENGALURU</p>
          </div>
        </footer>

      </div>

      {/* Delete modal */}
      {deleteModalProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeleteModalProject(null)}>
          <div className="bg-[#121215] border border-white/[0.1] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold text-white">Archive project?</h3>
            <p className="text-[12.5px] text-zinc-400 leading-relaxed">
              This will archive <strong className="text-white">{deleteModalProject.name}</strong>. Archived projects are hidden from Explore but remain accessible in your Archive tab. You can restore them later.
            </p>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
                Type "{deleteModalProject.name}" to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={e => setDeleteConfirmInput(e.target.value)}
                placeholder={deleteModalProject.name}
                className="w-full h-10 px-3 bg-[#09090b] border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setDeleteModalProject(null); setDeleteConfirmInput('') }} disabled={deleting} className="px-4 h-9 text-[12.5px] font-semibold text-zinc-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirmDelete} disabled={deleting || deleteConfirmInput.trim() !== deleteModalProject.name.trim()} className="px-4 h-9 bg-red-500/20 border border-red-500/40 text-red-300 font-bold rounded-lg text-[12.5px] hover:bg-red-500/30 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                {deleting ? <><CircleNotch size={14} className="animate-spin" /> Archiving</> : 'Archive project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoPanel({ title, text, linkText, linkHref }: { title: string; text: string; linkText: string; linkHref: string }) {
  return (
    <div className="p-5 border border-white/[0.04] rounded-xl bg-[#121215]">
      <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2.5">{title}</p>
      <p className="text-[12.5px] text-zinc-300 leading-relaxed mb-3.5">{text}</p>
      <Link href={linkHref} className="text-[12px] font-semibold text-white hover:underline inline-flex items-center gap-1">
        {linkText}
      </Link>
    </div>
  )
}

function ServicesPanel() {
  return (
    <div className="p-5 border border-white/[0.04] rounded-xl bg-[#121215] space-y-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">DSRT CONNECT SERVICES</p>
      <p className="text-[12.5px] text-zinc-300 leading-relaxed">
        Use the wider DSRT ecosystem to build, ship and grow your projects.
      </p>
      <div className="space-y-2 pt-1">
        <Link href="/looking-for" className="block group">
          <p className="text-[12px] font-bold text-white group-hover:underline">Looking For</p>
          <p className="text-[11px] text-zinc-500">Find collaborators and contributors.</p>
        </Link>
        <Link href="/ventures" className="block group">
          <p className="text-[12px] font-bold text-white group-hover:underline">Ventures</p>
          <p className="text-[11px] text-zinc-500">Turn a strong project into a full venture.</p>
        </Link>
        <Link href="/inbox" className="block group">
          <p className="text-[12px] font-bold text-white group-hover:underline">DSRT Mail</p>
          <p className="text-[11px] text-zinc-500">Communicate with collaborators.</p>
        </Link>
        <Link href="/coco" className="block group">
          <p className="text-[12px] font-bold text-white group-hover:underline">COCO</p>
          <p className="text-[11px] text-zinc-500">Plan, research and work across your projects.</p>
        </Link>
      </div>
      <div className="pt-2 border-t border-white/[0.04]">
        <Link href="/community" className="text-[12px] font-semibold text-white hover:underline inline-flex items-center gap-1">
          Explore communities →
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
    <div onClick={handleCardClick} className="group relative bg-[#121215] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-5 flex flex-col md:flex-row gap-5 cursor-pointer transition-all shadow-sm">
      <div className="w-full md:w-[200px] h-[125px] rounded-xl bg-[#09090b] border border-white/[0.06] overflow-hidden flex-shrink-0 relative">
        {project.cover_image_url ? (
          <img src={project.cover_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900/60"><Wrench size={30} className="text-zinc-700" /></div>
        )}
        {project.logo_url && (
          <div className="absolute bottom-2.5 left-2.5 w-10 h-10 rounded-lg border border-white/[0.1] shadow-lg bg-[#09090b] overflow-hidden">
            <img src={project.logo_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col py-0.5">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[17px] font-bold text-white truncate group-hover:text-zinc-200 transition-colors">{project.name}</h3>
              {project.is_dsrt_verified && <CheckCircle size={13} weight="fill" className="text-purple-400 shrink-0" />}
            </div>
            {(project.tagline || project.short_description) && (
              <p className="text-[13px] text-zinc-400 truncate mt-0.5">{project.tagline || project.short_description}</p>
            )}
          </div>

          <div className="relative flex-shrink-0">
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }} className="w-8 h-8 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors">
              <DotsThree size={20} weight="bold" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
                <div className="absolute right-0 top-full mt-1 z-40 w-48 bg-[#0d0d10] border border-white/[0.08] rounded-xl shadow-2xl p-1 space-y-0.5">
                  <button onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.slug}`) }} className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors">Open project</button>
                  <button onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.slug}?tab=settings`) }} className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors">Edit project</button>
                  <button onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.slug}?tab=team`) }} className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors">Manage team</button>
                  <button onClick={handleCopyLink} className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors">Share project</button>
                  <div className="h-px bg-white/[0.06] my-1" />
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDeleteRequest(project) }} className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">Archive project</button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-[12px] text-zinc-500 font-medium my-2 flex-wrap">
          {domainTags.slice(0, 2).map((d, i) => <span key={i}>{d}</span>)}
          {project.stage && <><span className="w-1 h-1 rounded-full bg-zinc-700" /><span className="capitalize">{project.stage}</span></>}
          {project.location && <><span className="w-1 h-1 rounded-full bg-zinc-700" /><span className="flex items-center gap-1"><MapPin size={11} /> {project.location}</span></>}
        </div>

        {techTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {techTags.slice(0, 5).map((t, i) => (
              <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-white/[0.04] border border-white/[0.06] text-zinc-400">{t}</span>
            ))}
            {techTags.length > 5 && <span className="text-[10.5px] text-zinc-600">+{techTags.length - 5}</span>}
          </div>
        )}

        <p className="text-[13px] text-zinc-300 line-clamp-2 leading-relaxed mb-auto">
          {project.short_description || project.description || 'Provide a concise overview of what this project builds and why.'}
        </p>

        <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Stage</p>
              <p className="text-[12px] font-semibold text-white capitalize">{project.stage || 'Idea'}</p>
            </div>
            <div>
              <p className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Status</p>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${project.status === 'archived' ? 'bg-zinc-500' : project.status === 'draft' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <p className="text-[12px] font-semibold text-zinc-300 capitalize">{project.status === 'archived' ? 'Archived' : project.status === 'draft' ? 'Draft' : 'Active'}</p>
              </div>
            </div>
            <div>
              <p className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Team</p>
              <p className="text-[12px] font-semibold text-zinc-300 flex items-center gap-1"><Users size={12} /> {project.team_size || 1}</p>
            </div>
            {project.is_open_source && (
              <div>
                <p className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Open Source</p>
                <p className="text-[12px] font-semibold text-zinc-300 flex items-center gap-1"><GitBranch size={11} /> Yes</p>
              </div>
            )}
          </div>
          <button onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.slug}`) }} className="h-8 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[12px] font-semibold text-white transition-colors">
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
    <div 
      onClick={() => router.push(`/projects/create?continue=${project.slug}`)} 
      className="w-[240px] flex-shrink-0 bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer group"
    >
      <div className="relative h-[90px] overflow-hidden">
        {project.cover_image_url ? (
          <img src={project.cover_image_url} alt="" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 flex items-center justify-center">
            <Wrench size={22} className="text-white/25" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute top-2 left-2 text-[9px] font-bold text-white/80 bg-white/10 border border-white/20 px-2 py-0.5 rounded uppercase tracking-wider">
          Draft
        </span>
      </div>
      <div className="p-3">
        <h4 className="text-[13px] font-bold text-white truncate mb-0.5">{project.name}</h4>
        {project.project_number && (
          <p className="text-[10.5px] text-white/40 font-mono mb-2">{project.project_number}</p>
        )}
        <p className="text-[10.5px] text-white/50 mb-2">
          Last edited {timeAgo(project.updated_at || project.created_at)}
        </p>
        <button className="w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-white bg-white/[0.06] group-hover:bg-white group-hover:text-black px-2.5 h-7 rounded-md transition-colors">
          Continue <ArrowRight size={10} weight="bold" />
        </button>
      </div>
    </div>
  )
}

function ProjectSectionRow({ title, subtitle, projects, onDeleteRequest, emptyMessage }: any) {
  if (projects.length === 0 && !emptyMessage) return null
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-[16px] font-bold text-white flex items-center gap-2">{title} <span className="text-[11px] font-normal text-zinc-500">{projects.length}</span></h2>
        {subtitle && <p className="text-[12.5px] text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      {projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map((p: any) => <ProjectHorizontalCard key={p.id} project={p} onDeleteRequest={onDeleteRequest} />)}
        </div>
      ) : emptyMessage ? (
        <div className="p-8 border border-white/[0.05] rounded-xl bg-[#0d0d10]/50 text-center"><p className="text-[12.5px] text-zinc-500">{emptyMessage}</p></div>
      ) : null}
    </section>
  )
}

function ProjectTechnicalMarquee({ resources }: { resources: any[] }) {
  const [isPaused, setIsPaused] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/resources/save')
      .then(r => r.json())
      .then(d => {
        const founderSaves = (d.saved || [])
          .filter((s: any) => s.source_type === 'founder')
          .map((s: any) => s.resource_id)
        setSavedIds(new Set(founderSaves))
      })
      .catch(() => {})
  }, [])

  const handleToggleSave = async (resourceId: string, isSaved: boolean) => {
    setSavedIds(prev => {
      const next = new Set(prev)
      if (isSaved) next.delete(resourceId)
      else next.add(resourceId)
      return next
    })
    try {
      await fetch('/api/resources/save', {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource_id: resourceId, source_type: 'founder' })
      })
      toast.success(isSaved ? 'Removed from library' : 'Saved to library')
    } catch {
      setSavedIds(prev => {
        const next = new Set(prev)
        if (isSaved) next.add(resourceId)
        else next.delete(resourceId)
        return next
      })
    }
  }

  if (resources.length === 0) return null
  const duplicated = [...resources, ...resources, ...resources]

  return (
    <div className="mt-20 pt-12 border-t border-white/[0.08]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#121215] border border-white/[0.08] flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img src="/dsrt-resources-icon.png" alt="" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-[19px] font-bold text-white">DSRT Technical Library</h2>
            <p className="text-[13.5px] text-zinc-500 mt-0.5">Engineering essays, system design guides, and hidden gems for builders.</p>
          </div>
        </div>
        <Link href="/resources" className="text-[12.5px] font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
          Explore library <ArrowRight size={11} />
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-2xl" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-[#09090b] to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-[#09090b] to-transparent pointer-events-none" />
        <div className="flex gap-4 py-2" style={{ animation: `marquee-scroll ${resources.length * 8}s linear infinite`, animationPlayState: isPaused ? 'paused' : 'running', width: 'fit-content' }}>
          {duplicated.map((item, idx) => {
            const isSaved = savedIds.has(item.id)
            return (
              <div key={`${item.id}-${idx}`} className="group flex-shrink-0 w-[300px] p-5 bg-[#121215] border border-white/[0.06] hover:border-white/[0.16] rounded-xl transition-all block relative">
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleSave(item.id, isSaved) }} className={`absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isSaved ? 'bg-white/[0.08] text-white' : 'bg-transparent text-zinc-600 hover:bg-white/[0.06] hover:text-white'}`}>
                  <BookmarkSimple size={13} weight={isSaved ? 'fill' : 'regular'} />
                </button>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="flex items-center gap-2 mb-3 pr-8">
                    <p className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold flex-1 truncate">{item.category}</p>
                    {item.is_hidden_gem && <Star size={11} weight="fill" className="text-zinc-400 shrink-0" />}
                  </div>
                  <p className="text-[13.5px] font-bold text-white group-hover:text-zinc-200 transition-colors leading-snug mb-2 line-clamp-2 min-h-[38px]">{item.title}</p>
                  {item.description && <p className="text-[11.5px] text-zinc-500 leading-relaxed line-clamp-2 mb-3 min-h-[30px]">{item.description}</p>}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
                    <p className="text-[11px] text-zinc-400 font-semibold truncate">{item.provider}</p>
                    <ArrowSquareOut size={11} className="text-zinc-600 group-hover:text-white transition-colors" />
                  </div>
                </a>
              </div>
            )
          })}
        </div>
      </div>
      <style jsx>{` @keyframes marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } } `}</style>
    </div>
  )
}