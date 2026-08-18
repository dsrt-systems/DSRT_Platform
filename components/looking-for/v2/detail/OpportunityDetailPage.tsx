'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Warning } from '@phosphor-icons/react'
import { OpportunityHeader } from './OpportunityHeader'
import { OpportunityBody } from './OpportunityBody'
import { OpportunitySidebar } from './OpportunitySidebar'
import { PosterCard } from './PosterCard'
import { ApplyModal } from './ApplyModal'
import { ShareModal } from './ShareModal'
import { ReportModal } from './ReportModal'

interface Props {
  id: string
}

type Tab = 'opportunity' | 'about-poster'

export function OpportunityDetailPage({ id }: Props) {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('opportunity')

  const [showApply, setShowApply] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/opportunities/${id}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Not found')
      }
      const json = await res.json()
      setData(json)
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  // Track view with dwell time
  useEffect(() => {
    if (!data?.id) return
    const enter = Date.now()
    const sessionId = typeof window !== 'undefined'
      ? (sessionStorage.getItem('dsrt_sid') || (() => {
          const s = 'sid_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10)
          sessionStorage.setItem('dsrt_sid', s)
          return s
        })())
      : undefined

    // Initial view ping
    fetch(`/api/opportunities/${data.id}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        source: 'direct',
        referrer_url: typeof document !== 'undefined' ? document.referrer : null,
        device_type: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
      }),
    }).catch(() => {})

    // Send dwell time on unmount
    return () => {
      const dwell = Date.now() - enter
      if (dwell > 2000 && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        try {
          navigator.sendBeacon(
            `/api/opportunities/${data.id}/view`,
            new Blob([JSON.stringify({ session_id: sessionId, dwell_ms: dwell })], { type: 'application/json' })
          )
        } catch {}
      }
    }
  }, [data?.id])

  const handleSave = async () => {
    if (!data) return
    const newSaved = !data.is_saved
    setData((d: any) => d ? { ...d, is_saved: newSaved } : d)
    try {
      if (newSaved) {
        await fetch(`/api/opportunities/${data.id}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
      } else {
        await fetch(`/api/opportunities/${data.id}/save`, { method: 'DELETE' })
      }
    } catch {
      setData((d: any) => d ? { ...d, is_saved: !newSaved } : d)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="h-6 w-32 bg-zinc-900 rounded mb-6 animate-pulse" />
          <div className="h-8 w-3/4 bg-zinc-900 rounded mb-4 animate-pulse" />
          <div className="h-4 w-1/2 bg-zinc-900 rounded mb-8 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8">
            <div className="space-y-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-zinc-900 rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="space-y-3">
              <div className="h-64 bg-zinc-900 rounded-xl animate-pulse" />
              <div className="h-48 bg-zinc-900 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-500">
            <Warning size={20} />
          </div>
          <h1 className="text-[18px] font-bold text-white mb-1.5">
            {error === 'Not found' || error?.includes('not found') ? 'Opportunity not found' : 'Something went wrong'}
          </h1>
          <p className="text-[13px] text-zinc-500 mb-5">{error}</p>
          <Link
            href="/looking-for"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-zinc-800 hover:border-zinc-700 text-[13px] text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={13} weight="bold" />
            Back to Looking For
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = data.is_owner
  const isClosed = data.is_closed
  const hasApplied = data.has_applied

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col">
      {/* Sticky action header */}
      <OpportunityHeader
        opportunity={data}
        tab={tab}
        onTabChange={setTab}
        isOwner={isOwner}
        isClosed={isClosed}
        hasApplied={hasApplied}
        onApply={() => setShowApply(true)}
        onSave={handleSave}
        onShare={() => setShowShare(true)}
        onReport={() => setShowReport(true)}
        onBack={() => router.back()}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          {tab === 'opportunity' ? (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8">
              {/* Left: Body */}
              <div className="min-w-0">
                <OpportunityBody opportunity={data} />
              </div>

                            {/* Right: Sidebar */}
              <aside className="min-w-0">
                <div className="space-y-4 lg:sticky lg:top-[100px]">
                  <OpportunitySidebar
                    opportunity={data}
                    isOwner={isOwner}
                    isClosed={isClosed}
                    hasApplied={hasApplied}
                    onApply={() => setShowApply(true)}
                  />
                  <PosterCard opportunity={data} />
                </div>
              </aside>
            </div>
          ) : (
            <PosterAboutView opportunity={data} />
          )}
        </div>
      </main>

      {/* Modals */}
      {showApply && (
        <ApplyModal
          opportunity={data}
          onClose={() => setShowApply(false)}
          onSuccess={() => {
            setShowApply(false)
            setData((d: any) => d ? { ...d, has_applied: true } : d)
          }}
        />
      )}
      {showShare && (
        <ShareModal
          opportunity={data}
          onClose={() => setShowShare(false)}
        />
      )}
      {showReport && (
        <ReportModal
          opportunity={data}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}

// ─── Poster About view (Tab 2) ───
function PosterAboutView({ opportunity }: { opportunity: any }) {
  const poster = opportunity.poster
  if (!poster) {
    return (
      <div className="text-center py-16 text-[13px] text-zinc-500">
        No poster information available.
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-8 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex items-start gap-5 mb-6">
          <div className="w-20 h-20 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
            {poster.avatar_url ? (
              <img src={poster.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-zinc-500">
                {(poster.full_name || poster.username || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[22px] font-bold text-white leading-tight">
              {poster.full_name || poster.username}
            </h2>
            {poster.tagline && (
              <p className="text-[13.5px] text-zinc-400 mt-1">{poster.tagline}</p>
            )}
            {poster.location && (
              <p className="text-[12.5px] text-zinc-500 mt-2">{poster.location}</p>
            )}
            <div className="flex items-center gap-3 mt-3 text-[11.5px] text-zinc-500">
              {poster.follower_count > 0 && (
                <span>{poster.follower_count} followers</span>
              )}
              {poster.is_verified && (
                <>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span className="text-emerald-400">Verified builder</span>
                </>
              )}
            </div>
          </div>
        </div>

        {poster.bio && (
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3">About</h3>
            <p className="text-[14px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {poster.bio}
            </p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-zinc-800 flex gap-2">
          <Link
            href={`/profile/${poster.username}`}
            className="inline-flex items-center h-9 px-4 rounded-md bg-white text-black hover:bg-zinc-200 text-[13px] font-semibold transition-colors"
          >
            View full profile
          </Link>
        </div>
      </div>
    </div>
  )
}