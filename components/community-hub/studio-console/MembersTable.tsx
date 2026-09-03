'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Search,
  Crown,
  Shield,
  Gavel,
  User,
  MoreHorizontal,
  UserMinus,
  UserX,
  Pause,
  Play,
  Loader2,
  ArrowRightLeft,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/components/ui/sonner'
import {
  SectionHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  SkeletonRows,
} from '@/components/kernel-ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { useStudioMembers } from '@/hooks/useCommunityStudio'
import { ReasonPromptDialog, ConfirmDialog } from '@/components/ui/reason-prompt-dialog'

const ROLE_META: Record<string, { label: string; icon: any; tone: string }> = {
  OWNER: { label: 'Owner', icon: Crown, tone: 'border-white/[0.14] bg-white/[0.06] text-white' },
  ADMIN: { label: 'Admin', icon: Shield, tone: 'border-white/[0.08] bg-white/[0.04] text-white/85' },
  MODERATOR: { label: 'Moderator', icon: Gavel, tone: 'border-white/[0.06] bg-white/[0.02] text-white/70' },
  MEMBER: { label: 'Member', icon: User, tone: 'border-white/[0.04] bg-white/[0.015] text-white/60' },
}

const STATUS_META: Record<string, { label: string; tone: string }> = {
  ACTIVE: { label: 'Active', tone: 'text-emerald-300/85' },
  SUSPENDED: { label: 'Suspended', tone: 'text-amber-300/85' },
  BANNED: { label: 'Banned', tone: 'text-red-300/85' },
  LEFT: { label: 'Left', tone: 'text-white/50' },
  REMOVED: { label: 'Removed', tone: 'text-white/50' },
  PENDING: { label: 'Pending', tone: 'text-amber-300/85' },
  APPLIED: { label: 'Applied', tone: 'text-amber-300/85' },
  INVITED: { label: 'Invited', tone: 'text-white/60' },
  REJECTED: { label: 'Rejected', tone: 'text-white/50' },
}

const ROLE_FILTERS = [
  { key: null, label: 'All roles' },
  { key: 'OWNER', label: 'Owner' },
  { key: 'ADMIN', label: 'Admin' },
  { key: 'MODERATOR', label: 'Moderator' },
  { key: 'MEMBER', label: 'Member' },
] as const

const STATUS_FILTERS = [
  { key: 'ACTIVE', label: 'Active' },
  { key: 'SUSPENDED', label: 'Suspended' },
  { key: 'BANNED', label: 'Banned' },
  { key: 'ALL', label: 'All statuses' },
] as const

interface Props {
  slug: string
}

type PendingUI =
  | { kind: 'action'; membershipId: string; action: 'suspend' | 'ban'; memberName: string }
  | { kind: 'remove'; membershipId: string; memberName: string }
  | null

export function MembersTable({ slug }: Props) {
  const [role, setRole] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>('ACTIVE')
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [ui, setUi] = useState<PendingUI>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    reload,
    loadMore,
    patchItem,
  } = useStudioMembers(slug, { role, status, q })

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '400px' }
    )
    io.observe(sentinelRef.current)
    return () => io.disconnect()
  }, [hasMore, loading, loadMore])

  const doAction = async (
    membershipId: string,
    action: 'suspend' | 'unsuspend' | 'ban' | 'unban' | 'remove' | 'reinstate',
    reason?: string
  ) => {
    setBusy(membershipId + action)
    try {
      const res = await fetch(`/api/v1/community/memberships/${membershipId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error?.message || 'Action failed')
        return
      }
      toast.success('Done')
      patchItem(membershipId, { status: json?.data?.new_status })
      if (status && status !== 'ALL' && json?.data?.new_status !== status) reload()
    } finally {
      setBusy(null)
    }
  }

  const doAssignRole = async (membershipId: string, roleKey: string) => {
    setBusy(membershipId + 'role')
    try {
      const res = await fetch(`/api/v1/community/memberships/${membershipId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_key: roleKey }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error?.message || 'Assign failed')
        return
      }
      toast.success('Role updated')
      reload()
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <section>
        <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
          <SectionHeader
            title="Members"
            description="Manage roles, restrictions, and access."
            variant="mono"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <FilterPills value={role} onChange={setRole} options={ROLE_FILTERS} />
            <FilterPills value={status} onChange={setStatus} options={STATUS_FILTERS} />
            <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1">
              <Search className="w-3 h-3 text-white/40" strokeWidth={1.75} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="bg-transparent outline-none text-[12px] text-white placeholder:text-white/30 w-40"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <SkeletonRows count={6} />
        ) : error ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <ErrorState errorCode={error} onRetry={reload} />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <EmptyState
              icon={Users}
              title="No members match"
              description="Try adjusting filters or search."
            />
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
              <div className="hidden md:grid grid-cols-[minmax(220px,2fr)_1fr_1fr_140px_60px] gap-4 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="text-[10.5px] font-mono uppercase tracking-wider text-white/45">Member</div>
                <div className="text-[10.5px] font-mono uppercase tracking-wider text-white/45">Role</div>
                <div className="text-[10.5px] font-mono uppercase tracking-wider text-white/45">Status</div>
                <div className="text-[10.5px] font-mono uppercase tracking-wider text-white/45">Joined</div>
                <div />
              </div>

              {items.map((m: any) => {
                const u = m.user
                const roleMeta = ROLE_META[m.top_role] || ROLE_META.MEMBER
                const statusMeta = STATUS_META[m.status] || { label: m.status, tone: 'text-white/60' }
                const isOwner = m.top_role === 'OWNER'
                const isBanned = m.status === 'BANNED'
                const isSuspended = m.status === 'SUSPENDED'
                const isActive = m.status === 'ACTIVE'
                const memberName = u?.full_name || u?.username || 'this member'

                return (
                  <div
                    key={m.membership_id}
                    className="grid grid-cols-[1fr_60px] md:grid-cols-[minmax(220px,2fr)_1fr_1fr_140px_60px] gap-4 items-center px-4 py-3 border-b border-white/[0.04] last:border-none hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-9 h-9 border border-white/[0.06] flex-shrink-0">
                        <AvatarImage src={u?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[11px] bg-white/[0.06] text-white/80">
                          {(u?.full_name || '?').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link
                          href={`/profile/${u?.username || ''}`}
                          className="text-[13px] font-semibold text-white truncate hover:underline flex items-center gap-1"
                        >
                          {u?.full_name || 'Unknown'}
                          {u?.is_verified && (
                            <ShieldCheck className="w-3 h-3 text-white/60" strokeWidth={1.75} />
                          )}
                        </Link>
                        <p className="text-[11px] text-white/45 truncate">@{u?.username || '—'}</p>
                        {/* Mobile-only role/status row */}
                        <div className="md:hidden mt-1 flex items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9.5px] font-mono uppercase tracking-wider',
                              roleMeta.tone
                            )}
                          >
                            <roleMeta.icon className="w-2.5 h-2.5" strokeWidth={1.75} />
                            {roleMeta.label}
                          </span>
                          <span className={cn('text-[10px] font-mono uppercase tracking-wider', statusMeta.tone)}>
                            {statusMeta.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-1.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-mono uppercase tracking-wider',
                          roleMeta.tone
                        )}
                      >
                        <roleMeta.icon className="w-3 h-3" strokeWidth={1.75} />
                        {roleMeta.label}
                      </span>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                      <span className={cn('text-[11.5px] font-mono uppercase tracking-wider', statusMeta.tone)}>
                        {statusMeta.label}
                      </span>
                      {m.restrictions?.length > 0 && (
                        <span className="text-[10px] font-mono text-white/40">
                          · {m.restrictions.length} restriction{m.restrictions.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div className="hidden md:block text-[11px] text-white/50">
                      {formatDistanceToNow(new Date(m.joined_at), { addSuffix: true })}
                    </div>

                    <div className="flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            disabled={isOwner || busy?.startsWith(m.membership_id)}
                            className={cn(
                              'w-8 h-8 rounded-full border border-white/[0.06] bg-white/[0.02] flex items-center justify-center transition-colors',
                              !isOwner
                                ? 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                                : 'text-white/20 cursor-not-allowed'
                            )}
                          >
                            {busy?.startsWith(m.membership_id) ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <MoreHorizontal className="w-4 h-4" strokeWidth={1.75} />
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-52 bg-[#0f0f14] border-white/[0.08] text-white"
                        >
                          <DropdownMenuLabel className="text-[10.5px] font-mono uppercase tracking-wider text-white/45">
                            Change role
                          </DropdownMenuLabel>
                          {['ADMIN', 'MODERATOR', 'MEMBER'].map((r) => (
                            <DropdownMenuItem
                              key={r}
                              onSelect={() => doAssignRole(m.membership_id, r)}
                              className="focus:bg-white/[0.06] cursor-pointer"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5 mr-2" strokeWidth={1.75} />
                              Make {r.toLowerCase()}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator className="bg-white/[0.06]" />
                          {isActive && (
                            <DropdownMenuItem
                              onSelect={() =>
                                setUi({ kind: 'action', membershipId: m.membership_id, action: 'suspend', memberName })
                              }
                              className="focus:bg-white/[0.06] cursor-pointer"
                            >
                              <Pause className="w-3.5 h-3.5 mr-2" strokeWidth={1.75} />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {isSuspended && (
                            <DropdownMenuItem
                              onSelect={() => doAction(m.membership_id, 'unsuspend')}
                              className="focus:bg-white/[0.06] cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 mr-2" strokeWidth={1.75} />
                              Unsuspend
                            </DropdownMenuItem>
                          )}
                          {!isBanned && (
                            <DropdownMenuItem
                              onSelect={() =>
                                setUi({ kind: 'action', membershipId: m.membership_id, action: 'ban', memberName })
                              }
                              className="focus:bg-white/[0.06] cursor-pointer text-red-300 focus:text-red-200"
                            >
                              <UserX className="w-3.5 h-3.5 mr-2" strokeWidth={1.75} />
                              Ban
                            </DropdownMenuItem>
                          )}
                          {isBanned && (
                            <DropdownMenuItem
                              onSelect={() => doAction(m.membership_id, 'unban')}
                              className="focus:bg-white/[0.06] cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 mr-2" strokeWidth={1.75} />
                              Unban
                            </DropdownMenuItem>
                          )}
                          {isActive && (
                            <DropdownMenuItem
                              onSelect={() => setUi({ kind: 'remove', membershipId: m.membership_id, memberName })}
                              className="focus:bg-white/[0.06] cursor-pointer text-red-300 focus:text-red-200"
                            >
                              <UserMinus className="w-3.5 h-3.5 mr-2" strokeWidth={1.75} />
                              Remove
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>

            {hasMore && (
              <div ref={sentinelRef} className="pt-6">
                {loadingMore && <LoadingState variant="compact" label="Loading more…" />}
              </div>
            )}
          </>
        )}
      </section>

      {/* Suspend / Ban with reason */}
      {ui?.kind === 'action' && (
        <ReasonPromptDialog
          open
          onOpenChange={(v) => !v && setUi(null)}
          title={ui.action === 'ban' ? `Ban ${ui.memberName}` : `Suspend ${ui.memberName}`}
          description={
            ui.action === 'ban'
              ? 'Ban is permanent until manually lifted. The affected member will be notified.'
              : 'Suspension prevents posting and participation. Reason is sent to the member.'
          }
          placeholder="Reason (optional but recommended)…"
          submitLabel={ui.action === 'ban' ? 'Ban member' : 'Suspend'}
          destructive
          onSubmit={async (reason) => {
            await doAction(ui.membershipId, ui.action, reason || undefined)
          }}
        />
      )}

      {/* Remove confirm */}
      {ui?.kind === 'remove' && (
        <ConfirmDialog
          open
          onOpenChange={(v) => !v && setUi(null)}
          title={`Remove ${ui.memberName} from the community?`}
          description="They can re-apply or be re-invited later. No notification is sent."
          confirmLabel="Remove member"
          destructive
          onConfirm={async () => {
            await doAction(ui.membershipId, 'remove')
          }}
        />
      )}
    </>
  )
}

function FilterPills({ value, onChange, options }: any) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] p-1">
      {options.map((o: any) => (
        <button
          key={String(o.key)}
          onClick={() => onChange(o.key)}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-colors',
            value === o.key ? 'bg-white text-black' : 'text-white/60 hover:text-white'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}