'use client'

import { useState, useTransition, useEffect } from 'react'
import { Check, Clock, Loader2, Lock, X, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/sonner'

interface Props {
  event: any
  config: any
  myRegistration?: any
  onChanged?: () => void
}

export function EventRegistrationButton({ event, config, myRegistration, onChanged }: Props) {
  const [pending, startTransition] = useTransition()
  const [local, setLocal] = useState(myRegistration || null)
  const [checkinToken, setCheckinToken] = useState<string | null>(null)

  useEffect(() => {
    setLocal(myRegistration || null)
  }, [myRegistration])

  const isCancelled = event.status === 'CANCELLED'
  const isFull = config?.capacity && config.confirmed_count >= config.capacity
  const closesAt = config?.registration_closes_at ? new Date(config.registration_closes_at) : null
  const closed = closesAt && closesAt < new Date()

  const register = () => {
    startTransition(async () => {
      const res = await fetch(`/api/v1/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `reg-${event.id}-${Date.now()}` },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json?.error?.message || 'Registration failed'); return }
      const d = json?.data
      setLocal({ status: d.status, registration_number: d.registration_number, waitlist_position: d.waitlist_position, id: d.registration_id })
      if (d.checkin_token) setCheckinToken(d.checkin_token)
      toast.success(d.status === 'CONFIRMED' ? `Registered · ${d.registration_number}` : 'You are on the waitlist')
      onChanged?.()
    })
  }

  const cancel = () => {
    if (!local?.id) return
    if (!confirm('Cancel your registration?')) return
    startTransition(async () => {
      const res = await fetch(`/api/v1/events/registrations/${local.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) { toast.error('Cancel failed'); return }
      setLocal(null); setCheckinToken(null)
      toast.success('Registration cancelled')
      onChanged?.()
    })
  }

  if (isCancelled) {
    return (
      <button disabled className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 text-red-300 px-4 py-2 text-[12.5px] font-medium">
        <X className="w-3.5 h-3.5" strokeWidth={1.75} /> Event cancelled
      </button>
    )
  }

  if (local?.status === 'CONFIRMED' || local?.status === 'ATTENDED') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 px-4 py-2 text-[12.5px] font-medium">
          <Check className="w-3.5 h-3.5" strokeWidth={2} /> {local.status === 'ATTENDED' ? 'Checked in' : 'Registered'}
          {local.registration_number && <span className="ml-1 font-mono text-[11px]">#{local.registration_number}</span>}
        </span>
        {checkinToken && (
          <a
            href={`/checkin/${checkinToken}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-white/80 hover:text-white px-3 py-2 text-[12px] font-medium transition-colors"
          >
            <Ticket className="w-3.5 h-3.5" strokeWidth={1.75} /> View ticket
          </a>
        )}
        {config?.allow_cancellation !== false && local.status !== 'ATTENDED' && (
          <button onClick={cancel} className="text-[12px] text-white/50 hover:text-white transition-colors">
            Cancel
          </button>
        )}
      </div>
    )
  }

  if (local?.status === 'WAITLISTED') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 text-amber-300 px-4 py-2 text-[12.5px] font-medium">
          <Clock className="w-3.5 h-3.5" strokeWidth={1.75} /> Waitlisted
          {local.waitlist_position && <span className="ml-1 font-mono text-[11px]">#{local.waitlist_position}</span>}
        </span>
        <button onClick={cancel} className="text-[12px] text-white/50 hover:text-white transition-colors">
          Leave waitlist
        </button>
      </div>
    )
  }

  if (closed) {
    return (
      <button disabled className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/40 px-4 py-2 text-[12.5px] font-medium">
        <Lock className="w-3.5 h-3.5" strokeWidth={1.75} /> Registration closed
      </button>
    )
  }

  if (config?.registration_mode === 'CLOSED') {
    return (
      <button disabled className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/40 px-4 py-2 text-[12.5px] font-medium">
        <Lock className="w-3.5 h-3.5" strokeWidth={1.75} /> Closed
      </button>
    )
  }

  const willWaitlist = isFull && config?.allow_waitlist !== false
  const label = willWaitlist ? 'Join waitlist' : 'Register'

  return (
    <button
      onClick={register}
      disabled={pending}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-white text-black hover:bg-zinc-100 px-4 py-2 text-[12.5px] font-semibold transition-colors',
        pending && 'opacity-70'
      )}
    >
      {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ticket className="w-3.5 h-3.5" strokeWidth={1.75} />}
      {label}
    </button>
  )
}