'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Info, Question, Newspaper, Image as ImageIcon, BookOpen, UsersThree,
  Gear, ShareNetwork, BookmarkSimple, DotsThreeOutline, ChartBar, Bell
} from '@phosphor-icons/react'

import { VentureHeader } from './VentureHeader'
import { VentureSidebar } from './VentureSidebar'
import { VentureOverview } from './VentureOverview'
import { VentureQuestionsTab } from './questions/VentureQuestionsTab'
import { VentureUpdates } from './updates/VentureUpdates'
import { VentureMediaTab } from './media/VentureMediaTab'
import { VentureDocumentsTab } from './documents/VentureDocumentsTab'
import { VentureTeamStructure } from './team/VentureTeamStructure'
import { VentureAnalytics } from './VentureAnalytics'
import { VentureNotificationsTab } from './notifications/VentureNotificationsTab'
import { VentureSettings } from './VentureSettings'
import { ConnectComposer } from '@/components/inbox/ConnectComposer'
import { PostPublishWelcomeModal } from '@/components/venture-assessment/PostPublishWelcomeModal'

interface Props { slug: string }

export function VentureDetailPage({ slug }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const t = params.get('tab')
      if (t) return t
    }
    return 'overview'
  })
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [connectOpen, setConnectOpen] = useState(false)

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch('/api/ventures/' + slug)
      if (!res.ok) {
        if (res.status === 404) { router.push('/ventures'); return }
        throw new Error('Failed to load')
      }
      const json = await res.json()
      setData(json)
    } catch (e) { 
      console.error('Fetch detail error:', e) 
    } finally { 
      setLoading(false) 
    }
  }, [slug, router])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))
    fetchDetail()
  }, [fetchDetail, supabase])

  // ── Track venture view on mount ──
  useEffect(() => {
    if (!data?.venture?.id) return
    const sessionId = (() => {
      if (typeof window === 'undefined') return 'ssr'
      let sid = sessionStorage.getItem('dsrt_session_id')
      if (!sid) {
        sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10)
        sessionStorage.setItem('dsrt_session_id', sid)
      }
      return sid
    })()

    fetch('/api/ventures/' + slug + '/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'direct',
        session_id: sessionId,
        referrer_url: typeof document !== 'undefined' ? document.referrer : null,
        device_type: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
      }),
    }).catch(() => {})
  }, [data?.venture?.id, slug])

  const patchVenture = async (patch: Record<string, any>) => {
    try {
      const res = await fetch('/api/ventures/' + slug, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Update failed')
      const json = await res.json()
      setData((prev: any) => ({ ...prev, venture: { ...prev.venture, ...json.venture } }))
    } catch (e) { 
      console.error('Patch venture error:', e) 
    }
  }

  const toggleFollow = async () => {
    try {
      const res = await fetch('/api/ventures/' + slug + '/followers', { method: 'POST' })
      const json = await res.json()
      setData((prev: any) => ({
        ...prev,
        isFollowing: json.following,
        venture: { ...prev.venture, follower_count: (prev.venture.follower_count || 0) + (json.following ? 1 : -1) }
      }))
    } catch (e) { 
      console.error('Toggle follow error:', e) 
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <Skeleton className="h-4 w-24 mb-3 bg-white/5" />
        <Skeleton className="h-[280px] w-full mb-5 bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full bg-white/5 rounded-lg" />
            <Skeleton className="h-[300px] w-full bg-white/5 rounded-xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-[300px] bg-white/5 rounded-xl" />
            <Skeleton className="h-[220px] bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!data?.venture) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <p className="text-[14px] text-white/50">Venture not found.</p>
      </div>
    )
  }

  const { venture, team, lookingFor, updates, founder, isFollowing, isOwner } = data
  const unreadNotifs = venture.unread_notifications || 0

  const headerStats = {
    team: team?.length || 0,
    followers: venture.follower_count || 0,
    applications: 0,
    openRoles: (lookingFor || []).filter((r: any) => r.status === 'active' || !r.status).length,
  }

  // ─── STREAMLINED INFORMATION ARCHITECTURE TABS ───
  const tabs: { id: string; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'questions', label: 'Questions', icon: Question },
    { id: 'updates', label: 'Updates', icon: Newspaper, badge: updates?.length || 0 },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'documents', label: 'Documents', icon: BookOpen },
    { id: 'team', label: 'Team & Roles', icon: UsersThree, badge: (team?.length || 0) + (lookingFor?.length || 0) },
  ]

  if (isOwner) {
    tabs.push({ id: 'analytics', label: 'Analytics', icon: ChartBar })
    tabs.push({ id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifs })
    tabs.push({ id: 'settings', label: 'Settings', icon: Gear })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20 xl:pb-8 text-white">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">

        {/* Venture Header */}
        <VentureHeader
          venture={venture}
          founder={founder}
          isOwner={isOwner}
          isFollowing={isFollowing}
          onFollowToggle={toggleFollow}
          onUpdate={patchVenture}
          onMessage={() => setConnectOpen(true)}
          onConnect={() => setConnectOpen(true)}
          stats={headerStats}
        />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 mt-6">
          <div className="min-w-0">
            
            {/* Top Sub-Navigation Bar */}
            <div className="flex items-center justify-between border-b border-white/[0.08] mb-6">
              <div className="flex gap-0.5 -mb-px overflow-x-auto scrollbar-hide">
                {tabs.map(t => {
                  const Icon = t.icon
                  const active = activeTab === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={
                        'px-4 py-3 text-[14px] font-medium whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ' +
                        (active
                          ? 'text-white border-white'
                          : 'text-white/45 border-transparent hover:text-white/80')
                      }
                    >
                      <Icon size={15} weight={active ? 'fill' : 'regular'} />
                      {t.label}
                      {t.badge !== undefined && t.badge > 0 && (
                        <span className="ml-0.5 text-[10px] font-bold bg-white/10 text-white/80 px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {t.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-0.5 pb-2">
                <button className="w-8 h-8 rounded-md hover:bg-white/[0.05] text-white/50 hover:text-white flex items-center justify-center transition-colors" title="Share">
                  <ShareNetwork size={15} />
                </button>
                <button className="w-8 h-8 rounded-md hover:bg-white/[0.05] text-white/50 hover:text-white flex items-center justify-center transition-colors" title="Save">
                  <BookmarkSimple size={15} />
                </button>
                <button className="w-8 h-8 rounded-md hover:bg-white/[0.05] text-white/50 hover:text-white flex items-center justify-center transition-colors" title="More">
                  <DotsThreeOutline size={15} />
                </button>
              </div>
            </div>

            {/* Active Tab Views */}
            {activeTab === 'overview' && (
              <VentureOverview venture={venture} isOwner={isOwner} onUpdate={patchVenture} />
            )}
            {activeTab === 'questions' && (
              <VentureQuestionsTab slug={slug} isOwner={isOwner} />
            )}
            {activeTab === 'updates' && (
              <VentureUpdates venture={venture} updates={updates || []} slug={slug} isOwner={isOwner} currentUserId={currentUserId} />
            )}
            {activeTab === 'media' && (
              <VentureMediaTab slug={slug} isOwner={isOwner} />
            )}
            {activeTab === 'documents' && (
              <VentureDocumentsTab slug={slug} isOwner={isOwner} />
            )}
            {activeTab === 'team' && (
              <VentureTeamStructure venture={venture} team={team || []} slug={slug} isOwner={isOwner} currentUserId={currentUserId} />
            )}
            {activeTab === 'analytics' && isOwner && (
              <VentureAnalytics slug={slug} />
            )}
            {activeTab === 'notifications' && isOwner && (
              <VentureNotificationsTab slug={slug} />
            )}
            {activeTab === 'settings' && isOwner && (
              <VentureSettings venture={venture} slug={slug} onUpdate={patchVenture} />
            )}
          </div>

          {/* Right Sidebar */}
          <div className="min-w-0">
            <VentureSidebar
              venture={venture}
              founder={founder}
              team={team || []}
              products={[]}
              roles={lookingFor || []}
              isOwner={isOwner}
              onUpdate={patchVenture}
            />
          </div>
        </div>
      </div>

      {/* Direct Contact Composer */}
      {connectOpen && (
        <ConnectComposer
          referenceType="venture"
          referenceId={venture.id}
          referenceName={venture.name}
          referenceSlug={venture.slug}
          onClose={() => setConnectOpen(false)}
          onSent={() => {
            fetchDetail()
          }}
        />
      )}

      {/* Post-Publish Welcome Flow */}
      {isOwner && (
        <Suspense fallback={null}>
          <PostPublishWelcomeModal
            slug={slug}
            ventureName={venture.name}
          />
        </Suspense>
      )}
    </div>
  )
}