'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Warning, ArrowUpRight, CheckCircle } from '@phosphor-icons/react'
import { StatusRibbon } from './parts/StatusRibbon'
import { JourneySteps } from './parts/JourneySteps'
import { NextActionBanner } from './parts/NextActionBanner'
import { CuratedTimeline } from './parts/CuratedTimeline'
import { MessageThread } from './parts/MessageThread'
import { MessageComposer } from './parts/MessageComposer'
import { InterviewCard } from './parts/InterviewCard'
import { DocumentsPanel } from './parts/DocumentsPanel'
import { AvailabilityDrawer } from './parts/AvailabilityDrawer'
import { WithdrawModal } from '../WithdrawModal'
import { useRouter } from 'next/navigation'

export function ApplicantPortalShell({ applicationId }: { applicationId: string }) {
  const router = useRouter()
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAvailability, setShowAvailability] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`/api/applications/${applicationId}/portal`, { cache: 'no-store' })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'Failed')
      setData(d)
    } catch (e: any) {
      setError(e?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }, [applicationId])

  useEffect(() => { load() }, [load])

  // Auto-mark read whenever the page is visible
  useEffect(() => {
    if (!data) return
    fetch(`/api/applications/${applicationId}/mark-read`, { method: 'POST' }).catch(() => {})
  }, [data, applicationId])

  // Poll every 30s while tab is visible
  useEffect(() => {
    const start = () => {
      if (pollRef.current) return
      pollRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') load()
      }, 30000)
    }
    const stop = () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
    start()
    const onVis = () => {
      if (document.visibilityState === 'visible') { load(); start() }
      else stop()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => { stop(); document.removeEventListener('visibilitychange', onVis) }
  }, [load])

  const handleWithdraw = async (reason: string, note: string) => {
    setWithdrawing(true)
    try {
      const res = await fetch(`/api/opportunities/${data.opportunity.id}/apply`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Failed to withdraw')
      router.push('/looking-for/my-applications')
    } catch (e: any) {
      alert(e?.message || 'Withdraw failed')
    } finally {
      setWithdrawing(false)
      setShowWithdraw(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-zinc-100">
        <div className="max-w-[1120px] mx-auto px-4 md:px-6 py-8 space-y-4">
          <div className="h-6 w-32 rounded bg-zinc-900 animate-pulse" />
          <div className="h-24 rounded-2xl bg-zinc-900 animate-pulse" />
          <div className="h-48 rounded-2xl bg-zinc-900 animate-pulse" />
          <div className="h-64 rounded-2xl bg-zinc-900 animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex items-center justify-center">
        <div className="text-center px-6">
          <Warning size={22} className="mx-auto mb-3 text-red-400" />
          <div className="text-[15px] font-bold text-white mb-2">{error || 'Not found'}</div>
          <Link href="/looking-for/my-applications" className="text-[13px] text-zinc-400 hover:text-white">
            ← Back to My Applications
          </Link>
        </div>
      </div>
    )
  }

  const { application, opportunity, events, messages, interviews, my_availability_slots, documents } = data
  const canWithdraw = !['withdrawn', 'rejected', 'hired', 'draft'].includes(application.pipeline_stage)

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100">
      <div className="max-w-[1120px] mx-auto px-4 md:px-6 py-8">
        <Link
          href="/looking-for/my-applications"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-400 hover:text-white mb-5 transition-colors"
        >
          <ArrowLeft size={12} weight="bold" /> My Applications
        </Link>

        <StatusRibbon application={application} opportunity={opportunity} />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
          <div className="space-y-6 min-w-0">
            <NextActionBanner
              application={application}
              interviews={interviews}
              onOpenAvailability={() => setShowAvailability(true)}
            />

            <JourneySteps application={application} />

            {interviews.length > 0 && (
              <div className="space-y-3">
                {interviews.map((iv: any) => (
                  <InterviewCard
                    key={iv.id}
                    interview={iv}
                    onRefresh={load}
                  />
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0f0f11] overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-white">Messages</h3>
                {messages.length > 0 && (
                  <span className="text-[11px] text-zinc-500">{messages.length} in thread</span>
                )}
              </div>
              <div className="p-4 max-h-[520px] overflow-y-auto">
                <MessageThread messages={messages} counterparty={opportunity.poster} />
              </div>
              <div className="border-t border-zinc-800/80 p-3">
                <MessageComposer applicationId={application.id} onSent={load} />
              </div>
            </div>

            <CuratedTimeline events={events} />
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 mb-4">Actions</h3>
              <Link
                href={`/looking-for/${opportunity.slug || opportunity.id}`}
                className="w-full h-10 rounded-xl border border-zinc-800 hover:border-zinc-600 bg-zinc-950 text-[13px] font-semibold text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 mb-3"
              >
                View Opportunity <ArrowUpRight size={12} weight="bold" />
              </Link>
              <button
                onClick={() => setShowAvailability(true)}
                className="w-full h-10 rounded-xl border border-zinc-800 hover:border-zinc-600 bg-zinc-950 text-[13px] font-semibold text-zinc-300 hover:text-white transition-colors mb-3"
              >
                Share your availability
              </button>
              {canWithdraw && (
                <button
                  onClick={() => setShowWithdraw(true)}
                  className="w-full h-10 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-[13px] font-semibold transition-colors"
                >
                  Withdraw Application
                </button>
              )}
            </div>

            <DocumentsPanel documents={documents} application={application} />

            {opportunity.poster && (
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 mb-4">Posted By</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center text-[12px] font-bold text-zinc-500">
                    {opportunity.poster.avatar_url ? (
                      <img src={opportunity.poster.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      (opportunity.poster.full_name || '?').charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-white truncate flex items-center gap-1.5">
                      {opportunity.poster.full_name}
                      {opportunity.poster.is_verified && <CheckCircle size={12} weight="fill" className="text-blue-400" />}
                    </div>
                    <div className="text-[11.5px] text-zinc-500">@{opportunity.poster.username}</div>
                  </div>
                </div>
                <Link
                  href={`/profile/${opportunity.poster.username}`}
                  className="mt-3 inline-flex items-center gap-1 text-[11.5px] text-zinc-400 hover:text-white transition-colors"
                >
                  View profile <ArrowUpRight size={10} weight="bold" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAvailability && (
        <AvailabilityDrawer
          applicationId={application.id}
          existing={my_availability_slots}
          onClose={() => setShowAvailability(false)}
          onSaved={() => { setShowAvailability(false); load() }}
        />
      )}

      <WithdrawModal
        isOpen={showWithdraw}
        opportunityTitle={opportunity.title}
        isLoading={withdrawing}
        onConfirm={handleWithdraw}
        onCancel={() => setShowWithdraw(false)}
      />
    </div>
  )
}