'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Info, Newspaper, UsersThree, BookOpen, Gear,
  ShareNetwork, BookmarkSimple, DotsThreeOutline, Briefcase, Package,
  ChartLineUp, CurrencyDollar, ClockClockwise, Handshake
} from '@phosphor-icons/react'
import { VentureHeader } from './VentureHeader'
import { VentureSidebar } from './VentureSidebar'
import { VentureOverview } from './VentureOverview'
import { VentureProducts } from './products/VentureProducts'
import { VentureGrowth } from './growth/VentureGrowth'
import { VentureTeamStructure } from './team/VentureTeamStructure'
import { VentureUpdates } from './updates/VentureUpdates'
import { VentureOpenRoles } from './VentureOpenRoles'
import { VentureFunding } from './funding/VentureFunding'
import { VentureTimeline } from './timeline/VentureTimeline'
import { VenturePartners } from './partners/VenturePartners'
import { VentureDocumentation } from './documentation/VentureDocumentation'
import { VentureSettings } from './VentureSettings'
import { VentureApplicants } from './applicants/VentureApplicants'
import { VentureNotificationsTab } from './notifications/VentureNotificationsTab'

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

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch('/api/ventures/' + slug)
      if (!res.ok) {
        if (res.status === 404) { router.push('/ventures'); return }
        throw new Error('Failed to load')
      }
      const json = await res.json()
      setData(json)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [slug, router])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))
    fetchDetail()
  }, [fetchDetail, supabase])

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
    } catch (e) { console.error(e) }
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
    } catch (e) { console.error(e) }
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

  const { venture, team, products, lookingFor, updates, metrics, timeline, partners, funding, founder, isFollowing, isOwner } = data

  const pendingApps = (data?.applications || []).filter((a: any) => a.status === 'pending').length
  const unreadNotifs = venture.unread_notifications || 0

  const tabs: { id: string; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'products', label: 'Products', icon: Package, badge: products?.length || 0 },
    { id: 'growth', label: 'Growth', icon: ChartLineUp },
    { id: 'team', label: 'Team & Roles', icon: UsersThree, badge: (team?.length || 0) + (lookingFor?.length || 0) },
    { id: 'updates', label: 'Updates', icon: Newspaper, badge: updates?.length || 0 },
    { id: 'funding', label: 'Funding', icon: CurrencyDollar },
    { id: 'timeline', label: 'Timeline', icon: ClockClockwise },
    { id: 'partners', label: 'Partners', icon: Handshake },
    { id: 'documentation', label: 'Docs', icon: BookOpen },
  ]
  if (isOwner) {
    tabs.push({ id: 'applicants', label: 'Applicants', icon: Briefcase, badge: pendingApps })
    tabs.push({ id: 'notifications', label: 'Notifications', icon: Newspaper, badge: unreadNotifs })
    tabs.push({ id: 'settings', label: 'Settings', icon: Gear })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20 xl:pb-8 text-white">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">

        <VentureHeader
          venture={venture}
          founder={founder}
          isOwner={isOwner}
          isFollowing={isFollowing}
          onFollowToggle={toggleFollow}
          onUpdate={patchVenture}
        />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 mt-6">
          <div className="min-w-0">
            <div className="flex items-center justify-between border-b border-white/[0.08] mb-6">
              <div className="flex gap-0.5 -mb-px overflow-x-auto scrollbar-hide">
                {tabs.map(t => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={
                        'px-4 py-3 text-[14px] font-medium whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ' +
                        (activeTab === t.id
                          ? 'text-white border-white'
                          : 'text-white/45 border-transparent hover:text-white/80')
                      }
                    >
                      <Icon size={15} weight={activeTab === t.id ? 'fill' : 'regular'} />
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

            {activeTab === 'overview' && (
              <VentureOverview venture={venture} isOwner={isOwner} onUpdate={patchVenture} />
            )}
            {activeTab === 'products' && (
              <VentureProducts venture={venture} products={products || []} slug={slug} isOwner={isOwner} />
            )}
            {activeTab === 'growth' && (
              <VentureGrowth venture={venture} metrics={metrics || []} slug={slug} isOwner={isOwner} />
            )}
            {activeTab === 'team' && (
              <VentureTeamStructure venture={venture} team={team || []} slug={slug} isOwner={isOwner} currentUserId={currentUserId} />
            )}

            {activeTab === 'updates' && (
              <VentureUpdates venture={venture} updates={updates || []} slug={slug} isOwner={isOwner} currentUserId={currentUserId} />
            )}
            {activeTab === 'funding' && (
              <VentureFunding venture={venture} rounds={funding || []} slug={slug} isOwner={isOwner} onUpdate={patchVenture} />
            )}
            {activeTab === 'timeline' && (
              <VentureTimeline venture={venture} events={timeline || []} slug={slug} isOwner={isOwner} />
            )}
            {activeTab === 'partners' && (
              <VenturePartners venture={venture} partners={partners || []} slug={slug} isOwner={isOwner} />
            )}
            {activeTab === 'documentation' && (
              <VentureDocumentation venture={venture} slug={slug} isOwner={isOwner} />
            )}
            {activeTab === 'applicants' && isOwner && (
              <VentureApplicants slug={slug} />
            )}
            {activeTab === 'notifications' && isOwner && (
              <VentureNotificationsTab slug={slug} />
            )}
            {activeTab === 'settings' && isOwner && (
              <VentureSettings venture={venture} slug={slug} onUpdate={patchVenture} />
            )}
          </div>

          <div className="min-w-0">
            <VentureSidebar
              venture={venture}
              founder={founder}
              team={team || []}
              products={products || []}
              roles={lookingFor || []}
              isOwner={isOwner}
              onUpdate={patchVenture}
            />
          </div>
        </div>
      </div>
    </div>
  )
}