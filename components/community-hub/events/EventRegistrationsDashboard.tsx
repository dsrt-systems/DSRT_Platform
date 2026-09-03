'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Clock, X, Ticket, QrCode, Loader2, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/components/ui/sonner'
import { SectionHeader, EmptyState, LoadingState, ErrorState } from '@/components/kernel-ui'
import { format } from 'date-fns'
import { useEventRegistrations, useEventDetail } from '@/hooks/useCommunityEvents'

interface Props {
  slug: string
  eventId: string
}

const STATUS_TONE: Record<string, string> = {
  CONFIRMED: 'text-emerald-300/85',
  WAITLISTED: 'text-amber-300/85',
  PENDING: 'text-blue-300/85',
  CANCELLED: 'text-white/45',
  REMOVED: 'text-white/45',
}

export function EventRegistrationsDashboard({ slug, eventId }: Props) {
  const [status, setStatus] = useState('ALL')
  const { data: eventData, loading: eventLoading, reload: reloadEvent } = useEventDetail(eventId)
  const { items, loading, error, reload } = useEventRegistrations(eventId, status)
  const [busy, setBusy] = useState<string | null>(null)

  const checkin = async (regId: string) => {
    setBusy(regId)
    try {
      const res = await fetch(`/api/v1/community/events/registrations/${regId}/manual-checkin`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { toast.error(json?.error?.message || 'Check-in failed'); return }
      toast.success(json?.data?.already_checked_in ? 'Already checked in' : 'Checked in')
      reload()
    } finally { setBusy(null) }
  }

  const filters = [
    { key: 'ALL', label: 'All' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'WAITLISTED', label: 'Waitlist' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ]

  if (eventLoading) return <LoadingState label="Loading event…" />
  if (!eventData) return null

  const config = eventData.config || {}
  const totalConfirmed = config.confirmed_count || 0
  const totalWaitlist = config.waitlist_count || 0
  const checkedIn = items.filter((r: any) => r.attendance).length

  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Tile label="Confirmed" value={totalConfirmed} />
        <Tile label="Waitlist" value={totalWaitlist} />
        <Tile label="Checked in" value={checkedIn} />
        <Tile label="Capacity" value={config.capacity ?? '∞'} />
      </div>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <SectionHeader title="Registrations" description="All attendees for this event." variant="mono" />
        <div className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] p-1">
          {filters.map(f => (
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

      {loading ? <LoadingState label="Loading registrations…" /> : error ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]"><ErrorState errorCode={error} onRetry={reload} /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]"><EmptyState icon={Ticket} title="No registrations yet" /></div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          {items.map((r: any) => {
            const u = r.user
            const attended = !!r.attendance
            return (
              <div key={r.id} className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.04] last:border-none hover:bg-white/[0.02]">
                <Avatar className="w-9 h-9 border border-white/[0.06]">
                  <AvatarImage src={u?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[11px] bg-white/[0.06] text-white/80">{(u?.full_name || '?').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${u?.username || ''}`} className="text-[13px] font-semibold text-white hover:underline flex items-center gap-1">
                    {u?.full_name || 'Unknown'}
                    {u?.is_verified && <ShieldCheck className="w-3 h-3 text-white/60" strokeWidth={1.75} />}
                  </Link>
                  <p className="text-[11px] text-white/45">
                    {r.registration_number || 'no number'} · registered {format(new Date(r.registered_at), 'MMM d · h:mm a')}
                    {attended && (
                      <>
                        {' · '}
                        <span className="text-emerald-300/80">checked in {format(new Date(r.attendance.checked_in_at), 'h:mm a')}</span>
                      </>
                    )}
                  </p>
                </div>
                <span className={cn('text-[10.5px] font-mono uppercase tracking-wider', STATUS_TONE[r.status] || 'text-white/60')}>
                  {r.status.toLowerCase()}
                </span>
                {r.status === 'CONFIRMED' && !attended && (
                  <button
                    onClick={() => checkin(r.id)}
                    disabled={busy === r.id}
                    className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-white/80 hover:text-white px-3 py-1 text-[11px] font-medium transition-colors"
                  >
                    {busy === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <QrCode className="w-3 h-3" strokeWidth={1.75} />}
                    Check in
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Tile({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-4">
      <p className="text-[24px] font-semibold text-white leading-none numeric">{value}</p>
      <p className="mt-1.5 text-[11px] font-mono uppercase tracking-wider text-white/45">{label}</p>
    </div>
  )
}