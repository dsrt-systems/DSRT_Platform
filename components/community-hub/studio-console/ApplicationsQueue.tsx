'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserCheck, Check, X, Loader2, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/components/ui/sonner'
import { SectionHeader, EmptyState, ErrorState, SkeletonRows } from '@/components/kernel-ui'
import { formatDistanceToNow } from 'date-fns'
import { useStudioApplications } from '@/hooks/useCommunityStudio'

interface Props {
  slug: string
}

export function ApplicationsQueue({ slug }: Props) {
  const [status, setStatus] = useState<string>('SUBMITTED,UNDER_REVIEW')
  const { items, loading, error, reload, removeItem } = useStudioApplications(slug, status)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const decide = async (applicationId: string, decision: 'APPROVED' | 'REJECTED') => {
    let reason: string | null = null
    if (decision === 'REJECTED') {
      reason = prompt('Optional reason for rejection (sent to applicant):')
    }
    setBusy(applicationId + decision)
    try {
      const res = await fetch(`/api/v1/communities/${slug}/applications/${applicationId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reason }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error?.message || 'Decision failed')
        return
      }
      toast.success(decision === 'APPROVED' ? 'Approved' : 'Rejected')
      removeItem(applicationId)
    } finally {
      setBusy(null)
    }
  }

  const filters = [
    { key: 'SUBMITTED,UNDER_REVIEW', label: 'Pending' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'REJECTED', label: 'Rejected' },
    { key: 'WITHDRAWN', label: 'Withdrawn' },
  ]

  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
        <SectionHeader
          title="Applications"
          description="Review and decide who joins."
          variant="mono"
        />
        <div className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatus(f.key)}
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-[11.5px] font-medium transition-colors',
                status === f.key ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonRows count={4} />
      ) : error ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <ErrorState errorCode={error} onRetry={reload} />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <EmptyState icon={UserCheck} title="No applications match this filter" />
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((a: any) => {
            const isPending = a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW'
            const isOpen = expanded.has(a.id)
            return (
              <div key={a.id} className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <Avatar className="w-11 h-11 border border-white/[0.06] flex-shrink-0">
                    <AvatarImage src={a.applicant?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[12px] bg-white/[0.06] text-white/80">
                      {(a.applicant?.full_name || '?').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/profile/${a.applicant?.username}`}
                        className="text-[13.5px] font-semibold text-white truncate hover:underline"
                      >
                        {a.applicant?.full_name || 'Anonymous'}
                      </Link>
                      {a.applicant?.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-white/60" strokeWidth={1.75} />}
                    </div>
                    <p className="text-[11.5px] text-white/50">
                      @{a.applicant?.username || '—'} · Applied {formatDistanceToNow(new Date(a.submitted_at), { addSuffix: true })}
                    </p>
                    {a.applicant?.tagline && (
                      <p className="mt-1 text-[12px] text-white/55 truncate">{a.applicant.tagline}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {a.answers.length > 0 && (
                      <button
                        onClick={() => toggle(a.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-white/70 hover:text-white px-3 py-1 text-[11px] font-medium transition-colors"
                      >
                        {isOpen ? <><ChevronUp className="w-3 h-3" /> Hide answers</> : <><ChevronDown className="w-3 h-3" /> Answers ({a.answers.length})</>}
                      </button>
                    )}
                    {isPending && (
                      <>
                        <button
                          onClick={() => decide(a.id, 'REJECTED')}
                          disabled={busy === a.id + 'REJECTED'}
                          className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-white/70 hover:text-white px-3 py-1.5 text-[11.5px] font-medium transition-colors"
                        >
                          {busy === a.id + 'REJECTED' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" strokeWidth={1.75} />}
                          Reject
                        </button>
                        <button
                          onClick={() => decide(a.id, 'APPROVED')}
                          disabled={busy === a.id + 'APPROVED'}
                          className="inline-flex items-center gap-1 rounded-full bg-white text-black hover:bg-zinc-100 px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors"
                        >
                          {busy === a.id + 'APPROVED' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" strokeWidth={2} />}
                          Approve
                        </button>
                      </>
                    )}
                    {!isPending && (
                      <span className={cn(
                        'text-[10.5px] font-mono uppercase tracking-wider px-2 py-1 rounded-full border',
                        a.status === 'APPROVED' && 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
                        a.status === 'REJECTED' && 'border-red-500/25 bg-red-500/10 text-red-300',
                        a.status === 'WITHDRAWN' && 'border-white/[0.06] bg-white/[0.02] text-white/50',
                      )}>
                        {a.status.toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>

                {isOpen && a.answers.length > 0 && (
                  <div className="border-t border-white/[0.06] bg-white/[0.015] p-4 space-y-3">
                    {a.answers.map((ans: any) => (
                      <div key={ans.question_key}>
                        <p className="text-[10.5px] font-mono uppercase tracking-wider text-white/40 mb-1">
                          {ans.question_label || ans.question_key}
                        </p>
                        <p className="text-[12.5px] text-white/75 whitespace-pre-wrap">
                          {ans.answer_value || JSON.stringify(ans.answer_json) || '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}