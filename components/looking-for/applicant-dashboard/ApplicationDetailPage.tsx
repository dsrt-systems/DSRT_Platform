'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Warning,
  CheckCircle,
  PauseCircle,
  ChatCircle,
  Handshake,
  XCircle,
  PencilSimple,
  ArrowUpRight,
  MapPin,
  Briefcase,
  Coins,
} from '@phosphor-icons/react'

import { WithdrawModal } from './WithdrawModal'
import { ApplicantInvitationCard } from './ApplicantInvitationCard'

const STAGE_META: Record<string, { label: string; Icon: any; color: string }> = {
  draft: { label: 'Draft', Icon: PencilSimple, color: 'text-zinc-400' },
  submitted: { label: 'Submitted', Icon: CheckCircle, color: 'text-zinc-300' },
  'under-review': { label: 'Under Review', Icon: PauseCircle, color: 'text-blue-400' },
  shortlisted: { label: 'Shortlisted', Icon: CheckCircle, color: 'text-cyan-400' },
  interview: { label: 'Interviewing', Icon: ChatCircle, color: 'text-purple-400' },
  offer: { label: 'Offer Received', Icon: Handshake, color: 'text-amber-400' },
  accepted: { label: 'Accepted', Icon: CheckCircle, color: 'text-emerald-400' },
  declined: { label: 'Rejected', Icon: XCircle, color: 'text-red-400' },
  withdrawn: { label: 'Withdrawn', Icon: XCircle, color: 'text-zinc-500' },
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return `${Math.floor(d / 7)}w ago`
}

export function ApplicationDetailPage({ applicationId }: { applicationId: string }) {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/opportunities/my-applications/${applicationId}`)
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'Failed')
      setData(d)
    } catch (e: any) {
      setError(e?.message)
    } finally {
      setLoading(false)
    }
  }, [applicationId])

  useEffect(() => {
    load()
  }, [load])

  const handleWithdraw = async (reason: string, note: string) => {
    setWithdrawing(true)
    try {
      const res = await fetch(`/api/opportunities/my-applications/${applicationId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, note }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Failed to withdraw')
      }
      // Redirect back to dashboard to see updated status
      router.push('/looking-for/my-applications')
    } catch (e: any) {
      alert(e?.message || 'Withdraw failed')
      setWithdrawing(false)
      setShowWithdraw(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-zinc-100">
        <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 space-y-4">
          <div className="h-8 w-1/3 bg-zinc-900 rounded animate-pulse" />
          <div className="h-48 bg-zinc-900 rounded-2xl animate-pulse" />
          <div className="h-64 bg-zinc-900 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex items-center justify-center">
        <div className="text-center px-6">
          <Warning size={24} className="mx-auto mb-3 text-red-400" />
          <div className="text-[15px] font-bold text-white mb-2">{error || 'Not found'}</div>
          <Link href="/looking-for/my-applications" className="text-[13px] text-zinc-400 hover:text-white">
            ← Back to My Applications
          </Link>
        </div>
      </div>
    )
  }

  const app = data.application
  const opp = data.opportunity
  const timeline = data.timeline || []
  const messages = data.messages || []
  const questions = data.questions || []
  const answers = app.answers || {}
  const meta = STAGE_META[app.pipeline_stage] || STAGE_META.submitted
  const canWithdraw = !['withdrawn', 'declined', 'accepted', 'draft'].includes(app.pipeline_stage)

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100">
      <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-8">
        {/* Back + Header */}
        <Link
          href="/looking-for/my-applications"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={12} weight="bold" /> My Applications
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Applicant Invitation Card */}
            <ApplicantInvitationCard applicationId={applicationId} onStatusChange={load} />

            {/* Opportunity Context Card */}
            <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0f0f11] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                  {opp?.venture?.logo_url ? (
                    <img src={opp.venture.logo_url} className="w-full h-full object-cover" alt="" />
                  ) : opp?.project?.icon ? (
                    <span className="text-xl">{opp.project.icon}</span>
                  ) : (
                    <span className="text-[16px] font-bold text-zinc-500">{(opp?.title || '?').charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-[20px] font-bold text-white leading-tight">{opp?.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[12px] text-zinc-500">
                    {(opp?.project?.name || opp?.venture?.name) && (
                      <span className="text-zinc-400 font-medium">{opp?.project?.name || opp?.venture?.name}</span>
                    )}
                    {opp?.opportunity_number && <span className="font-mono">{opp.opportunity_number}</span>}
                  </div>
                </div>
              </div>

              <div
                className={`inline-flex items-center gap-2 h-8 px-3 rounded-lg text-[12.5px] font-bold ${meta.color} border border-zinc-800 bg-zinc-950/60`}
              >
                <meta.Icon size={14} weight="fill" />
                {meta.label}
              </div>

              <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t border-zinc-800/70 text-[12px] text-zinc-400">
                {opp?.work_mode && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-zinc-500" /> <span className="capitalize">{opp.work_mode}</span>
                  </span>
                )}
                {opp?.time_commitment && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase size={13} className="text-zinc-500" /> {opp.time_commitment.replace(/-/g, ' ')}
                  </span>
                )}
                {opp?.compensation_type && opp.compensation_type !== 'unpaid' && (
                  <span className="flex items-center gap-1.5">
                    <Coins size={13} className="text-zinc-500" /> <span className="capitalize">{opp.compensation_type}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0f0f11] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <h2 className="text-[14px] font-bold text-white mb-5">Application Timeline</h2>

              <div className="relative pl-6 space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-800">
                {/* Application Created */}
                <TimelineItem label="Application started" date={app.created_at} active={false} />

                {/* Submission Event */}
                {app.pipeline_stage !== 'draft' && (
                  <TimelineItem
                    label="Application submitted"
                    date={app.stage_updated_at || app.updated_at}
                    active={app.pipeline_stage === 'submitted'}
                  />
                )}

                {/* History Events */}
                {timeline.map((evt: any) => {
                  const evtMeta = STAGE_META[evt.to_stage] || STAGE_META.submitted
                  return (
                    <TimelineItem
                      key={evt.id}
                      label={`Moved to ${evtMeta.label}`}
                      date={evt.created_at}
                      active={app.pipeline_stage === evt.to_stage}
                      reason={evt.reason}
                    />
                  )
                })}
              </div>
            </div>

            {/* Submitted Answers (Read-Only) */}
            {questions.length > 0 && Object.keys(answers).length > 0 && (
              <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0f0f11] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <h2 className="text-[14px] font-bold text-white mb-5">Your Answers</h2>
                <div className="space-y-5">
                  {questions.map((q: any, i: number) => {
                    const ans = answers[q.id]
                    if (ans === undefined || ans === null || ans === '') return null
                    return (
                      <div key={q.id}>
                        <div className="text-[12px] font-semibold text-zinc-400 mb-1.5">
                          Q{i + 1}. {q.label}
                        </div>
                        <div className="text-[13.5px] text-zinc-200 whitespace-pre-wrap leading-relaxed">
                          {Array.isArray(ans) ? ans.join(', ') : String(ans)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.length > 0 && (
              <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0f0f11] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="px-6 py-4 border-b border-zinc-800/80">
                  <h2 className="text-[14px] font-bold text-white">Messages</h2>
                </div>
                <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                  {messages.map((msg: any) => (
                    <div key={msg.id} className={`flex flex-col ${msg.is_mine ? 'items-end' : 'items-start'}`}>
                      <div
                        className={
                          'max-w-[80%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap ' +
                          (msg.is_mine
                            ? 'bg-zinc-200 text-black rounded-br-sm'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-sm')
                        }
                      >
                        {msg.body}
                      </div>
                      <div className={`text-[10.5px] text-zinc-600 mt-1 px-1 ${msg.is_mine ? 'mr-1' : 'ml-1'}`}>
                        {msg.sender?.full_name || 'You'} · {timeAgo(msg.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block space-y-4">
            {/* Actions */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 mb-4">Actions</h3>

              <Link
                href={`/looking-for/${opp?.slug || opp?.id}`}
                className="w-full h-10 rounded-xl border border-zinc-800 hover:border-zinc-600 bg-zinc-950 text-[13px] font-semibold text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 mb-3"
              >
                View Opportunity <ArrowUpRight size={12} weight="bold" />
              </Link>

              {canWithdraw && (
                <button
                  onClick={() => setShowWithdraw(true)}
                  className="w-full h-10 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-[13px] font-semibold transition-colors"
                >
                  Withdraw Application
                </button>
              )}
            </div>

            {/* Submission Summary */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 mb-4">Submission Summary</h3>

              <SummaryRow label="Skills Highlighted" value={(app.highlighted_skills || []).length} />
              <SummaryRow label="Projects Attached" value={(app.highlighted_projects || []).length} />
              <SummaryRow label="Questions Answered" value={Object.keys(answers).length} />
              <SummaryRow label="Resume" value={app.resume_url ? '✓' : '—'} />
              <SummaryRow label="Portfolio" value={app.portfolio_url ? '✓' : '—'} />
              <SummaryRow label="GitHub" value={app.github_url ? '✓' : '—'} />
            </div>

            {/* Poster Info */}
            {opp?.poster && (
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 mb-4">Posted By</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center text-[12px] font-bold text-zinc-500">
                    {opp.poster.avatar_url ? (
                      <img src={opp.poster.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      (opp.poster.full_name || '?').charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-white truncate flex items-center gap-1.5">
                      {opp.poster.full_name}
                      {opp.poster.is_verified && <CheckCircle size={12} weight="fill" className="text-blue-400" />}
                    </div>
                    <div className="text-[11.5px] text-zinc-500">@{opp.poster.username}</div>
                  </div>
                </div>
                <Link
                  href={`/profile/${opp.poster.username}`}
                  className="mt-3 inline-flex items-center gap-1 text-[11.5px] text-zinc-400 hover:text-white transition-colors"
                >
                  View profile <ArrowUpRight size={10} weight="bold" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Withdraw Confirmation Modal */}
      <WithdrawModal
        isOpen={showWithdraw}
        opportunityTitle={opp?.title || 'this opportunity'}
        isLoading={withdrawing}
        onConfirm={handleWithdraw}
        onCancel={() => setShowWithdraw(false)}
      />
    </div>
  )
}

function TimelineItem({
  label,
  date,
  active,
  reason,
}: {
  label: string
  date: string
  active: boolean
  reason?: string
}) {
  return (
    <div className="relative">
      <div
        className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 ${
          active ? 'bg-blue-500 border-blue-400' : 'bg-zinc-900 border-zinc-700'
        }`}
      />
      <div>
        <div className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-zinc-400'}`}>{label}</div>
        <div className="text-[11px] text-zinc-500 mt-0.5">
          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ·{' '}
          {new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
        {reason && <div className="text-[11.5px] text-zinc-500 mt-1 italic">"{reason}"</div>}
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between items-center py-1.5 text-[12px]">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-200 font-semibold">{String(value)}</span>
    </div>
  )
}