'use client'

import { useState } from 'react'
import { Mail, X, Loader2, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/components/ui/sonner'
import { SectionHeader, EmptyState, ErrorState, SkeletonRows } from '@/components/kernel-ui'
import { formatDistanceToNow } from 'date-fns'
import { useStudioInvitations } from '@/hooks/useCommunityStudio'

interface Props {
  slug: string
  communityId: string
}

export function InvitationsManager({ slug, communityId }: Props) {
  const { items, loading, error, reload } = useStudioInvitations(slug)
  const [email, setEmail] = useState('')
  const [roleKey, setRoleKey] = useState<'MEMBER' | 'MODERATOR' | 'ADMIN'>('MEMBER')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [lastLink, setLastLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const send = async () => {
    if (!email.trim()) {
      toast.error('Enter an email')
      return
    }
    setSending(true)
    try {
      const res = await fetch(`/api/v1/communities/${communityId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `inv-${communityId}-${Date.now()}`,
        },
        body: JSON.stringify({
          invited_email: email.trim(),
          role_key: roleKey,
          message: message.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error?.message || 'Could not send invitation')
        return
      }
      toast.success('Invitation created')
      const link = typeof window !== 'undefined' ? `${window.location.origin}${json.data.invite_url}` : json.data.invite_url
      setLastLink(link)
      setEmail('')
      setMessage('')
      reload()
    } finally {
      setSending(false)
    }
  }

  const revoke = async (id: string) => {
    if (!confirm('Revoke this invitation?')) return
    const res = await fetch(`/api/v1/community/invitations/${id}/revoke`, { method: 'POST' })
    if (!res.ok) {
      toast.error('Could not revoke')
      return
    }
    toast.success('Revoked')
    reload()
  }

  const copyLink = async () => {
    if (!lastLink) return
    await navigator.clipboard.writeText(lastLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pending = items.filter((i: any) => i.status === 'PENDING')
  const history = items.filter((i: any) => i.status !== 'PENDING')

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-5">
        <SectionHeader title="Send an invitation" variant="mono" />
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            className="rounded-lg border border-white/[0.08] bg-white/[0.02] focus:border-white/[0.18] outline-none px-3 py-2 text-[13px] text-white placeholder:text-white/30"
          />
          <select
            value={roleKey}
            onChange={(e) => setRoleKey(e.target.value as any)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.02] focus:border-white/[0.18] outline-none px-3 py-2 text-[13px] text-white appearance-none"
          >
            <option value="MEMBER">Member</option>
            <option value="MODERATOR">Moderator</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button
            onClick={send}
            disabled={sending}
            className="rounded-full bg-white text-black hover:bg-zinc-100 px-4 py-2 text-[12.5px] font-semibold transition-colors inline-flex items-center gap-1.5"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />}
            Send
          </button>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="Optional personal message"
          className="mt-3 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] focus:border-white/[0.18] outline-none px-3 py-2 text-[12.5px] text-white placeholder:text-white/30 resize-none"
        />

        {lastLink && (
          <div className="mt-4 rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 flex items-center gap-2">
            <p className="text-[12px] text-white/70 font-mono truncate flex-1">{lastLink}</p>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-white/80 hover:text-white px-3 py-1 text-[11px] font-medium transition-colors"
            >
              {copied ? <Check className="w-3 h-3" strokeWidth={2} /> : <Copy className="w-3 h-3" strokeWidth={1.75} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Pending invitations" variant="mono" />
        {loading ? (
          <SkeletonRows count={3} />
        ) : error ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <ErrorState errorCode={error} onRetry={reload} />
          </div>
        ) : pending.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <EmptyState variant="compact" icon={Mail} title="No pending invitations" />
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((inv: any) => (
              <InvitationRow key={inv.id} inv={inv} onRevoke={() => revoke(inv.id)} />
            ))}
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <SectionHeader title="History" variant="mono" />
          <div className="space-y-2">
            {history.slice(0, 15).map((inv: any) => (
              <InvitationRow key={inv.id} inv={inv} history />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function InvitationRow({ inv, onRevoke, history }: { inv: any; onRevoke?: () => void; history?: boolean }) {
  const statusTone: Record<string, string> = {
    PENDING: 'text-amber-300/85',
    ACCEPTED: 'text-emerald-300/85',
    DECLINED: 'text-white/50',
    EXPIRED: 'text-white/40',
    REVOKED: 'text-white/40',
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="w-9 h-9 rounded-full border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-white/60">
        <Mail className="w-4 h-4" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-white truncate">
          {inv.invitee?.full_name || inv.invited_email || 'Recipient'}
        </p>
        <p className="text-[11px] text-white/45 truncate">
          {inv.role?.name ? `Role: ${inv.role.name}` : 'Member'}
          {inv.inviter && ` · Invited by ${inv.inviter.full_name}`}
          {' · '}
          {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true })}
        </p>
      </div>
      <span className={cn('text-[10.5px] font-mono uppercase tracking-wider', statusTone[inv.status] || 'text-white/60')}>
        {inv.status.toLowerCase()}
      </span>
      {!history && onRevoke && (
        <button
          onClick={onRevoke}
          className="w-8 h-8 rounded-full border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-white/60 hover:text-white flex items-center justify-center transition-colors"
          title="Revoke"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
      )}
    </div>
  )
}