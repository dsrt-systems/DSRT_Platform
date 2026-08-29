'use client'

import { useState, useMemo } from 'react'
import { UserPlus, CheckCircle, XCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Props {
  requests: any[]
  slug: string
  onRefresh: () => void
}

export function RequestsPanel({ requests, slug, onRefresh }: Props) {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')

  const filtered = useMemo(() => {
    if (filter === 'all') return requests
    return requests.filter(r => r.status === filter)
  }, [requests, filter])

  const counts = useMemo(() => ({
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    all: requests.length,
  }), [requests])

  const handleDecision = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/ventures/${slug}/team/requests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: id, action })
      })
      if (!res.ok) throw new Error()
      toast.success(action === 'approve' ? 'Request approved · Member added' : 'Request rejected')
      onRefresh()
    } catch {
      toast.error('Action failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              'text-[11.5px] font-semibold px-2.5 h-7 rounded-lg capitalize transition-colors ' +
              (filter === f
                ? 'bg-white/[0.08] text-white border border-white/[0.15]'
                : 'text-zinc-500 hover:text-white bg-[#0d0d10] border border-white/[0.04]')
            }
          >
            {f}
            {counts[f] > 0 && <span className="ml-1 text-zinc-500">{counts[f]}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#121215] border border-white/[0.06] rounded-2xl p-12 text-center">
          <UserPlus size={28} className="text-zinc-600 mx-auto mb-3" />
          <p className="text-[13px] font-bold text-white mb-1">
            No {filter !== 'all' ? filter : ''} requests
          </p>
          <p className="text-[11.5px] text-zinc-500">
            Users who want to join your venture appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-[#121215] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
                  {r.applicant?.avatar_url ? (
                    <img src={r.applicant.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (r.applicant?.full_name || '?').charAt(0).toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-bold text-white">
                        {r.applicant?.full_name || 'Unknown'}
                      </p>
                      <p className="text-[11.5px] text-zinc-500">
                        @{r.applicant?.username} · Requested {formatDate(r.created_at)}
                      </p>
                    </div>
                    <span className={
                      'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ' +
                      (r.status === 'pending'
                        ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                        : r.status === 'approved'
                          ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-red-300 bg-red-500/10 border-red-500/20')
                    }>
                      {r.status}
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="text-[10.5px] font-mono uppercase tracking-widest text-zinc-500 font-semibold mb-1">
                      Requested Role
                    </p>
                    <p className="text-[13px] font-semibold text-white">{r.requested_role_title}</p>
                  </div>

                  {r.motivation && (
                    <div className="mt-3">
                      <p className="text-[10.5px] font-mono uppercase tracking-widest text-zinc-500 font-semibold mb-1">
                        Motivation
                      </p>
                      <p className="text-[12.5px] text-zinc-300 bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg leading-relaxed">
                        {r.motivation}
                      </p>
                    </div>
                  )}

                  {r.relevant_experience && (
                    <div className="mt-3">
                      <p className="text-[10.5px] font-mono uppercase tracking-widest text-zinc-500 font-semibold mb-1">
                        Relevant Experience
                      </p>
                      <p className="text-[12.5px] text-zinc-400 leading-relaxed">
                        {r.relevant_experience}
                      </p>
                    </div>
                  )}

                  {r.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleDecision(r.id, 'reject')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white/[0.04] hover:bg-red-500/10 border border-white/[0.06] hover:border-red-500/20 text-zinc-300 hover:text-red-300 text-[12px] font-semibold transition-colors"
                      >
                        <XCircle size={13} weight="bold" /> Decline
                      </button>
                      <button
                        onClick={() => handleDecision(r.id, 'approve')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white text-black hover:bg-zinc-200 text-[12px] font-bold transition-colors"
                      >
                        <CheckCircle size={13} weight="bold" /> Approve & Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}