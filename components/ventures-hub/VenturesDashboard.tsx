'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CreateVentureLandingModal } from '@/components/venture-assessment/CreateVentureLandingModal'
import { VentureExplorePage } from '@/components/ventures-explore/VentureExplorePage'
import {
  Plus,
  FolderSimple, Compass, Heart, Briefcase,
  Buildings, Users, ArrowRight, CircleNotch,
  CaretDown, WarningCircle, DotsThree, MapPin,
  ArrowSquareOut, Sparkle
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Venture {
  id: string
  slug: string
  name: string
  tagline?: string | null
  description?: string | null
  logo_url?: string | null
  cover_url?: string | null
  stage?: string
  status?: string
  industry?: string | null
  location?: string | null
  profile_completion?: number
  is_draft?: boolean
  is_verified?: boolean
  is_hiring?: boolean
  seeking_investment?: boolean
  follower_count?: number
  view_count?: number
  team_count?: number
  last_activity_at?: string
  updated_at?: string
  created_at?: string
}

type TabId = 'my-ventures' | 'explore' | 'following' | 'applications'

const TABS = [
  { id: 'my-ventures', label: 'My Ventures', icon: FolderSimple },
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

export function VenturesDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] text-white p-10 flex items-center justify-center">
        <CircleNotch size={24} className="animate-spin text-zinc-500 mr-2" />
        <span className="text-xs text-zinc-500 font-mono">Loading workspace...</span>
      </div>
    }>
      <VenturesDashboardContent />
    </Suspense>
  )
}

function VenturesDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const openCreate = useCallback(() => setCreateModalOpen(true), [])

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const tab = searchParams.get('tab')
    if (tab === 'explore' || tab === 'following' || tab === 'applications') return tab
    return 'my-ventures'
  })

  const [user, setUser] = useState<any>(null)
  const [myVentures, setMyVentures] = useState<Venture[]>([])
  const [followingVentures, setFollowingVentures] = useState<Venture[]>([])
  const [resources, setResources] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [sortOption, setSortOption] = useState<'updated' | 'created' | 'name' | 'stage'>('updated')
  const [sortOpen, setSortOpen] = useState(false)
  const [deleteModalVenture, setDeleteModalVenture] = useState<Venture | null>(null)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  const loadWorkspaceData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, avatar_url, username')
          .eq('id', user.id)
          .maybeSingle()
        if (profile) setUser({ ...user, profile })
      }

      const [venturesRes, resourcesRes] = await Promise.all([
        fetch('/api/ventures/me'),
        supabase.from('founder_resources').select('*').order('display_order', { ascending: true })
      ])

      if (venturesRes.ok) {
        const vJson = await venturesRes.json()
        setMyVentures(vJson.ventures || [])
      } else {
        const myRes = await fetch('/api/ventures/my')
        if (myRes.ok) {
          const myJson = await myRes.json()
          setMyVentures(myJson.ventures || [])
        }
      }

      if (resourcesRes.data) {
        setResources(resourcesRes.data)
      }
    } catch (e) {
      console.error('Ventures dashboard fetch error:', e)
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
      fetch('/api/ventures/following')
        .then(r => r.json())
        .then(d => setFollowingVentures(d.ventures || []))
        .catch(() => {})
    }
  }, [activeTab])

  const handleConfirmDelete = async () => {
    if (!deleteModalVenture || deleteConfirmInput.trim() !== deleteModalVenture.name.trim()) {
      toast.error('Venture name does not match')
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/ventures/${deleteModalVenture.slug}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete venture')

      toast.success('Venture deleted')
      setMyVentures(prev => prev.filter(v => v.id !== deleteModalVenture.id))
      setDeleteModalVenture(null)
      setDeleteConfirmInput('')
    } catch (e: any) {
      toast.error(e.message || 'Could not delete venture')
    } finally {
      setDeleting(false)
    }
  }

  const sortedVentures = [...myVentures].sort((a, b) => {
    if (sortOption === 'created') {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    }
    if (sortOption === 'name') {
      return a.name.localeCompare(b.name)
    }
    if (sortOption === 'stage') {
      return (a.stage || '').localeCompare(b.stage || '')
    }
    return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()
  })

  const firstName = user?.profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Founder'

  return (
    <div className="flex-1 min-h-screen bg-[#09090b] text-white pb-24 font-sans">
      <div className="max-w-[1240px] mx-auto px-4 md:px-6 pt-8">

        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-white leading-snug">
              {greeting()},{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                {firstName}
              </span>.
            </h1>
            <p className="text-[13.5px] text-zinc-400 mt-1">
              Here is what's happening across your ventures.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-white text-black hover:bg-zinc-200 text-[13px] font-bold shadow-sm transition-all active:scale-95 shrink-0"
          >
            <Plus size={14} weight="bold" /> New venture
          </button>
        </div>

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
                    (active ? 'text-white border-white font-semibold' : 'text-zinc-500 border-transparent hover:text-zinc-300')
                  }
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {activeTab === 'my-ventures' && (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
            <div className="space-y-4">
              <InfoPanel
                title="BUILD WITH INTENT"
                text="Your venture profile is the public representation of what you are building. Keep the information clear, current and specific. People evaluating your venture should understand the problem, product and direction quickly."
                linkText="Learn how to present your venture →"
                linkHref="/resources"
              />

              <InfoPanel
                title="DISCOVERABILITY"
                text="A complete venture profile can appear across DSRT Connect where relevant. Your venture may be surfaced to people based on industry, interests, skills, stage and activity."
                linkText="Manage visibility →"
                linkHref="/settings"
              />

              <ServicesPanel />

              <InfoPanel
                title="YOUR DATA"
                text="Information you provide to DSRT is used to operate your venture profile, improve discovery and provide relevant recommendations. You control the information you publish and the visibility of your venture."
                linkText="Read Data Policy →"
                linkHref="/privacy"
              />

              <div className="p-5 border border-white/[0.04] rounded-xl bg-[#0d0d10]">
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">FOUNDER NOTE</p>
                <p className="text-[12.5px] text-zinc-400 leading-relaxed italic">
                  "A strong venture profile is not about filling every field. It is about clearly communicating what matters."
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <div className="bg-[#121215] border border-white/[0.06] rounded-2xl p-8 mb-8 flex flex-col items-center text-center shadow-sm">
                <h2 className="text-[18px] font-bold text-white mb-2">Start a new venture</h2>
                <p className="text-[13.5px] text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
                  Bring your idea to life. Create a professional venture profile to present your company, product, vision and progress.
                </p>
                <button
                  onClick={openCreate}
                  className="flex items-center gap-1.5 h-10 px-5 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white font-semibold text-[13px] transition-colors"
                >
                  <Plus size={14} weight="bold" /> Start your venture
                </button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[16px] font-bold text-white">Your ventures</h2>
                  <p className="text-[12.5px] text-zinc-500 mt-0.5">Manage the ventures you own or help build.</p>
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
                        <button
                          onClick={() => { setSortOption('updated'); setSortOpen(false); }}
                          className={`w-full text-left px-3.5 py-2 text-[12px] transition-colors ${sortOption === 'updated' ? 'bg-white/[0.06] text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'}`}
                        >
                          Last updated
                        </button>
                        <button
                          onClick={() => { setSortOption('created'); setSortOpen(false); }}
                          className={`w-full text-left px-3.5 py-2 text-[12px] transition-colors ${sortOption === 'created' ? 'bg-white/[0.06] text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'}`}
                        >
                          Recently created
                        </button>
                        <button
                          onClick={() => { setSortOption('name'); setSortOpen(false); }}
                          className={`w-full text-left px-3.5 py-2 text-[12px] transition-colors ${sortOption === 'name' ? 'bg-white/[0.06] text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'}`}
                        >
                          Name (A–Z)
                        </button>
                        <button
                          onClick={() => { setSortOption('stage'); setSortOpen(false); }}
                          className={`w-full text-left px-3.5 py-2 text-[12px] transition-colors ${sortOption === 'stage' ? 'bg-white/[0.06] text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'}`}
                        >
                          Stage
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

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
                  <h3 className="text-[15px] font-bold text-white">Unable to load your ventures</h3>
                  <p className="text-[12.5px] text-zinc-400 max-w-sm mx-auto">
                    Something went wrong while retrieving your venture workspace.
                  </p>
                  <button
                    onClick={loadWorkspaceData}
                    className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white rounded-lg text-[12.5px] font-semibold transition-colors"
                  >
                    Try again
                  </button>
                </div>
              ) : sortedVentures.length === 0 ? (
                <div className="p-12 border border-white/[0.06] rounded-2xl bg-[#121215]/50 text-center space-y-3">
                  <Buildings size={32} className="text-zinc-600 mx-auto" />
                  <h3 className="text-[15px] font-bold text-white">No ventures yet</h3>
                  <p className="text-[13px] text-zinc-500 max-w-sm mx-auto">
                    You are not currently listed as owner or team member for any venture workspace.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedVentures.map(v => (
                    <VentureHorizontalCard
                      key={v.id}
                      venture={v}
                      onDeleteRequest={(target) => setDeleteModalVenture(target)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'explore' && (
          <div className="pt-2">
            <VentureExplorePage />
          </div>
        )}

        {activeTab === 'following' && (
          <div>
            {followingVentures.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.1] p-12 text-center bg-[#121215]/50">
                <Heart size={28} className="mx-auto mb-3 text-zinc-600" />
                <p className="text-[14px] font-bold text-white mb-1">Not following any ventures</p>
                <p className="text-[12.5px] text-zinc-500 mb-4">Follow ventures in Explore to track their growth updates.</p>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="inline-flex items-center h-9 px-4 rounded-lg bg-white text-black hover:bg-zinc-200 text-[13px] font-bold transition-colors"
                >
                  Explore ventures
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {followingVentures.map(v => (
                  <VentureHorizontalCard
                    key={v.id}
                    venture={v}
                    onDeleteRequest={(target) => setDeleteModalVenture(target)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="rounded-2xl border border-dashed border-white/[0.1] p-12 text-center bg-[#121215]/50">
            <Briefcase size={28} className="mx-auto mb-3 text-zinc-600" />
            <p className="text-[14px] font-bold text-white mb-1">Applications & Roles</p>
            <p className="text-[12.5px] text-zinc-500 max-w-sm mx-auto mb-4">
              Applications submitted to venture roles or received by your ventures are managed via canonical Looking For opportunities.
            </p>
            <Link
              href="/looking-for"
              className="inline-flex items-center h-9 px-4 rounded-lg bg-white text-black hover:bg-zinc-200 text-[13px] font-bold transition-colors"
            >
              Open Looking For
            </Link>
          </div>
        )}

        {activeTab !== 'explore' && (
          <FounderResourcesMarquee resources={resources} />
        )}

        <DSRTFooter />

      </div>

      {deleteModalVenture && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeleteModalVenture(null)}>
          <div className="bg-[#121215] border border-white/[0.1] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold text-white">Delete venture?</h3>
            <p className="text-[12.5px] text-zinc-400 leading-relaxed">
              This permanently removes the venture profile <strong className="text-white">{deleteModalVenture.name}</strong> and all associated configuration.
            </p>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
                Type "{deleteModalVenture.name}" to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={e => setDeleteConfirmInput(e.target.value)}
                placeholder={deleteModalVenture.name}
                className="w-full h-10 px-3 bg-[#09090b] border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setDeleteModalVenture(null); setDeleteConfirmInput(''); }}
                disabled={deleting}
                className="px-4 h-9 text-[12.5px] font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting || deleteConfirmInput.trim() !== deleteModalVenture.name.trim()}
                className="px-4 h-9 bg-red-500/20 border border-red-500/40 text-red-300 font-bold rounded-lg text-[12.5px] hover:bg-red-500/30 disabled:opacity-50 transition-colors"
              >
                {deleting ? <CircleNotch size={14} className="animate-spin" /> : 'Delete venture'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateVentureLandingModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
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
        Use the wider DSRT ecosystem to build and grow your venture.
      </p>

      <div className="space-y-2 pt-1">
        <Link href="/looking-for" className="block group">
          <p className="text-[12px] font-bold text-white group-hover:underline">Looking For</p>
          <p className="text-[11px] text-zinc-500">Find collaborators, contributors and talent.</p>
        </Link>
        <Link href="/projects" className="block group">
          <p className="text-[12px] font-bold text-white group-hover:underline">Projects</p>
          <p className="text-[11px] text-zinc-500">Show what you are actually building.</p>
        </Link>
        <Link href="/inbox" className="block group">
          <p className="text-[12px] font-bold text-white group-hover:underline">DSRT Mail</p>
          <p className="text-[11px] text-zinc-500">Communicate with collaborators and contacts.</p>
        </Link>
        <Link href="/coco" className="block group">
          <p className="text-[12px] font-bold text-white group-hover:underline">COCO</p>
          <p className="text-[11px] text-zinc-500">Plan, research and work across your venture.</p>
        </Link>
      </div>

      <div className="pt-2 border-t border-white/[0.04]">
        <Link href="/explore" className="text-[12px] font-semibold text-white hover:underline inline-flex items-center gap-1">
          Explore services →
        </Link>
      </div>
    </div>
  )
}

function VentureHorizontalCard({ venture, onDeleteRequest }: { venture: Venture; onDeleteRequest: (v: Venture) => void }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleCardClick = () => {
    router.push(`/ventures/${venture.slug}`)
  }

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/ventures/${venture.slug}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied')
    setMenuOpen(false)
  }

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-[#121215] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-5 flex flex-col md:flex-row gap-5 cursor-pointer transition-all shadow-sm"
    >
      <div className="w-full md:w-[200px] h-[125px] rounded-xl bg-[#09090b] border border-white/[0.06] overflow-hidden flex-shrink-0 relative">
        {venture.cover_url ? (
          <img src={venture.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900/60">
            <Buildings size={32} className="text-zinc-700" />
          </div>
        )}

        {venture.logo_url && (
          <div className="absolute bottom-2.5 left-2.5 w-10 h-10 rounded-lg border border-white/[0.1] shadow-lg bg-[#09090b] overflow-hidden">
            <img src={venture.logo_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col py-0.5">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="min-w-0">
            <h3 className="text-[17px] font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
              {venture.name}
            </h3>
            {venture.tagline && (
              <p className="text-[13px] text-zinc-400 truncate mt-0.5">{venture.tagline}</p>
            )}
          </div>

          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="w-8 h-8 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
            >
              <DotsThree size={20} weight="bold" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                <div className="absolute right-0 top-full mt-1 z-40 w-48 bg-[#0d0d10] border border-white/[0.08] rounded-xl shadow-2xl p-1 space-y-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/ventures/${venture.slug}`); }}
                    className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                  >
                    Open venture
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/ventures/${venture.slug}?tab=settings`); }}
                    className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                  >
                    Edit venture
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/ventures/${venture.slug}?tab=team`); }}
                    className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                  >
                    Manage team
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                  >
                    Share venture
                  </button>
                  <div className="h-px bg-white/[0.06] my-1" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDeleteRequest(venture); }}
                    className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    Delete venture
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-[12px] text-zinc-500 font-medium my-2">
          {venture.industry && <span>{venture.industry}</span>}
          {venture.industry && venture.stage && <span className="w-1 h-1 rounded-full bg-zinc-700" />}
          {venture.stage && <span className="capitalize">{venture.stage.replace('-', ' ')}</span>}
          {venture.stage && venture.location && <span className="w-1 h-1 rounded-full bg-zinc-700" />}
          {venture.location && <span className="flex items-center gap-1"><MapPin size={11} /> {venture.location}</span>}
        </div>

        <p className="text-[13px] text-zinc-300 line-clamp-2 leading-relaxed mb-auto">
          {venture.description || 'Provide a concise overview of the problem, product, and mission.'}
        </p>

        <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Profile</p>
              <p className="text-[12px] font-semibold text-white">{venture.profile_completion || 0}% complete</p>
            </div>
            <div>
              <p className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Status</p>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${venture.is_draft ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <p className="text-[12px] font-semibold text-zinc-300 capitalize">{venture.status || (venture.is_draft ? 'Draft' : 'Active')}</p>
              </div>
            </div>
            <div>
              <p className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Team</p>
              <p className="text-[12px] font-semibold text-zinc-300 flex items-center gap-1">
                <Users size={12} /> {venture.team_count || 1} member{(venture.team_count || 1) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/ventures/${venture.slug}`); }}
            className="h-8 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[12px] font-semibold text-white transition-colors"
          >
            {(venture.profile_completion || 0) < 100 ? 'Continue setup' : 'Open venture'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   COMPONENT: FounderResourcesMarquee (Auto-Scrolling Loop)
────────────────────────────────────────────────────────────── */
function FounderResourcesMarquee({ resources }: { resources: any[] }) {
  const [isPaused, setIsPaused] = useState(false)
  const [duplicated, setDuplicated] = useState<any[]>([])

  useEffect(() => {
    if (resources.length > 0) {
      // Duplicate the array 3x for seamless infinite loop
      setDuplicated([...resources, ...resources, ...resources])
    }
  }, [resources])

  if (resources.length === 0) return null

  return (
    <div className="mt-20 pt-12 border-t border-white/[0.08]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
            <Sparkle size={16} weight="fill" className="text-zinc-400" />
          </div>
          <div>
            <h2 className="text-[19px] font-bold text-white">Resources for founders</h2>
            <p className="text-[13.5px] text-zinc-500 mt-0.5">Curated essays, playbooks, and hidden gems from operators, investors, and researchers.</p>
          </div>
        </div>
        <Link href="/resources" className="text-[12.5px] font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
          Explore library <ArrowRight size={11} />
        </Link>
      </div>

      {/* Marquee Container */}
      <div
        className="relative overflow-hidden rounded-2xl"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-[#09090b] to-transparent pointer-events-none" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-[#09090b] to-transparent pointer-events-none" />

        <div
          className="flex gap-4 py-2"
          style={{
            animation: `marquee-scroll ${resources.length * 8}s linear infinite`,
            animationPlayState: isPaused ? 'paused' : 'running',
            width: 'fit-content',
          }}
        >
          {duplicated.map((item, idx) => (
            <ResourceCard key={`${item.id}-${idx}`} resource={item} />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  )
}

function ResourceCard({ resource }: { resource: any }) {
  const isHiddenGem = resource.is_hidden_gem
  
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex-shrink-0 w-[300px] p-5 bg-[#121215] border border-white/[0.06] hover:border-white/[0.16] rounded-xl transition-all block"
    >
      <div className="flex items-center gap-2 mb-3">
        <p className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold flex-1 truncate">
          {resource.category}
        </p>
        {isHiddenGem && (
          <span className="text-[8.5px] font-mono uppercase tracking-widest text-amber-500 font-bold flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">
            <Sparkle size={8} weight="fill" />
            Hidden Gem
          </span>
        )}
      </div>

      <p className="text-[13.5px] font-bold text-white group-hover:text-zinc-200 transition-colors leading-snug mb-2 line-clamp-2 min-h-[38px]">
        {resource.title}
      </p>

      {resource.description && (
        <p className="text-[11.5px] text-zinc-500 leading-relaxed line-clamp-2 mb-3 min-h-[30px]">
          {resource.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
        <p className="text-[11px] text-zinc-400 font-semibold truncate">
          {resource.provider}
        </p>
        <ArrowSquareOut size={11} className="text-zinc-600 group-hover:text-white transition-colors" />
      </div>
    </a>
  )
}

function DSRTFooter() {
  return (
    <footer className="mt-24 pt-12 border-t border-white/[0.08] text-[12px] text-zinc-500">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-white font-bold mb-3">DSRT CONNECT</p>
          <ul className="space-y-2">
            <li><Link href="/about" className="hover:text-zinc-300 transition-colors">About</Link></li>
            <li><Link href="/careers" className="hover:text-zinc-300 transition-colors">Careers</Link></li>
            <li><Link href="/contact" className="hover:text-zinc-300 transition-colors">Contact</Link></li>
            <li><Link href="/blog" className="hover:text-zinc-300 transition-colors">Blog</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-white font-bold mb-3">PLATFORM</p>
          <ul className="space-y-2">
            <li><Link href="/how-it-works" className="hover:text-zinc-300 transition-colors">How it works</Link></li>
            <li><Link href="/security" className="hover:text-zinc-300 transition-colors">Security</Link></li>
            <li><Link href="/trust" className="hover:text-zinc-300 transition-colors">Trust</Link></li>
            <li><Link href="/status" className="hover:text-zinc-300 transition-colors">Status</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-white font-bold mb-3">BUILD</p>
          <ul className="space-y-2">
            <li><Link href="/projects" className="hover:text-zinc-300 transition-colors">Projects</Link></li>
            <li><Link href="/ventures" className="hover:text-zinc-300 transition-colors">Ventures</Link></li>
            <li><Link href="/looking-for" className="hover:text-zinc-300 transition-colors">Looking For</Link></li>
            <li><Link href="/my-communities" className="hover:text-zinc-300 transition-colors">Communities</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-white font-bold mb-3">SUPPORT</p>
          <ul className="space-y-2">
            <li><Link href="/help" className="hover:text-zinc-300 transition-colors">Help Center</Link></li>
            <li><Link href="/support" className="hover:text-zinc-300 transition-colors">Contact support</Link></li>
            <li><Link href="/bugs" className="hover:text-zinc-300 transition-colors">Report a bug</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-white font-bold mb-3">LEGAL</p>
          <ul className="space-y-2">
            <li><Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link></li>
            <li><Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link></li>
            <li><Link href="/privacy" className="hover:text-zinc-300 transition-colors">Data Policy</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-white font-bold mb-3">CONNECT</p>
          <ul className="space-y-2">
            <li><a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">X (Twitter)</a></li>
            <li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">LinkedIn</a></li>
            <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">GitHub</a></li>
          </ul>
        </div>
      </div>

      <div className="pt-8 border-t border-white/[0.04] flex items-center justify-between">
        <p>© 2026 DSRT Connect. All rights reserved.</p>
        <p className="font-mono text-[11px]">MUMBAI· SAN FRANCISCO · BENGALURU</p>
      </div>
    </footer>
  )
}