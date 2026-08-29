'use client'

import { useState, useMemo } from 'react'
import { PaperPlaneTilt, ArrowClockwise, X, Clock, CheckCircle, XCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Props {
  invitations: any[]
  onRefresh: () => void
}

type InvitationFilter = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled' | 'all'

export function InvitationsPanel({ invitations, onRefresh }: Props) {
  const [filter, setFilter] = useState<InvitationFilter>('pending')

  const counts = useMemo(() => ({
    pending: invitations.filter(i => ['sent', 'viewed', 'held'].includes(i.status)).length,
    accepted: invitations.filter(i => i.status === 'accepted').length,
    rejected: invitations.filter(i => i.status === 'rejected').length,
    expired: invitations.filter(i => i.status === 'expired').length,
    cancelled: invitations.filter(i => i.status === 'cancelled').length,
    all: invitations.length,
  }), [invitations])

  const filtered = useMemo(() => {
    if (filter === 'all') return invitations
    if (filter === 'pending') return invitations.filter(i => ['sent', 'viewed', 'held'].includes(i.status))
    return invitations.filter(i => i.status === filter)
  }, [invitations, filter])

  const handleResend = async (id: string) => {
    try {
      const res = await fetch(`/api/venture-invitations/${id}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extend_days: 7 })
      })
      if (!res.ok) throw new Error()
      toast.success('Invitation resent · 7 days extended')
      onRefresh()
    } catch {
      toast.error('Could not resend invitation')
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this invitation? The recipient will no longer be able to accept.')) return
    try {
      const res = await fetch(`/api/venture-invitations/${id}/revoke`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('Invitation revoked')
      onRefresh()
    } catch {
      toast.error('Could not revoke invitation')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(['pending', 'accepted', 'held', 'rejected', 'expired', 'cancelled', 'all'] as InvitationFilter[]).map(f => (
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
            {(counts as any)[f] > 0 && (
              <span className="ml-1 text-zinc-500">{(counts as any)[f]}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-[#121215] border border-white/[0.06] rounded-2xl p-12 text-center">
          <PaperPlaneTilt size={28} className="text-zinc-600 mx-auto mb-3" />
          <p className="text-[13px] font-bold text-white mb-1">
            No {filter !== 'all' ? filter : ''} invitations
          </p>
          <p className="text-[11.5px] text-zinc-500">
            Invitations sent from the Graph or Directory appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(inv => (
            <InvitationRow
              key={inv.id}
              invitation={inv}
              onResend={handleResend}
              onRevoke={handleRevoke}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function InvitationRow({ invitation, onResend, onRevoke }: any) {
  const isPending = ['sent', 'viewed', 'held'].includes(invitation.status)
  const user = invitation.invited_user
  const expiresIn = invitation.expires_at
    ? Math.max(0, Math.ceil((new Date(invitation.expires_at).getTime() - Date.now()) / 86400000))
    : null

  return (
    <div className="bg-[#121215] border border-white/[0.06] hover:border-white/[0.1] rounded-xl p-4 flex items-center gap-4 transition-all">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          (user?.full_name || '?').charAt(0).toUpperCase()
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-bold text-white truncate">
            {user?.full_name || 'Unknown User'}
          </p>
          <StatusBadge status={invitation.status} />
        </div>
        <p className="text-[11.5px] text-zinc-400 truncate">
          {invitation.proposed_role_title}
          {invitation.position?.team_name && (
            <span className="text-zinc-600"> · {invitation.position.team_name}</span>
          )}
        </p>
        <p className="text-[10.5px] text-zinc-500 mt-1">
          Sent {formatRelativeTime(invitation.created_at)}
          {isPending && expiresIn !== null && (
            <span className={expiresIn <= 2 ? 'text-amber-400 ml-2' : 'ml-2'}>
              · Expires in {expiresIn}d
            </span>
          )}
        </p>
      </div>

      {isPending && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onResend(invitation.id)}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
            title="Resend"
          >
            <ArrowClockwise size={14} />
          </button>
          <button
            onClick={() => onRevoke(invitation.id)}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
            title="Revoke"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; icon: any }> = {
    sent: { label: 'Sent', color: 'text-blue-300 bg-blue-500/10 border-blue-500/20', icon: PaperPlaneTilt },
    viewed: { label: 'Viewed', color: 'text-purple-300 bg-purple-500/10 border-purple-500/20', icon: Clock },
    held: { label: 'On Hold', color: 'text-amber-300 bg-amber-500/10 border-amber-500/20', icon: Clock },
    accepted: { label: 'Accepted', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'text-red-300 bg-red-500/10 border-red-500/20', icon: XCircle },
    expired: { label: 'Expired', color: 'text-zinc-500 bg-zinc-800 border-zinc-700', icon: Clock },
    cancelled: { label: 'Cancelled', color: 'text-zinc-500 bg-zinc-800 border-zinc-700', icon: X },
  }
  const c = config[status] || config.sent
  return (
    <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${c.color}`}>
      {c.label}
    </span>
  )
}

function formatRelativeTime(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}