'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Check, Loader2, Clock, X, QrCode, Ticket, Lock } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'
import { toast } from '@/components/ui/sonner'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  event: any
  config: any
  myRegistration: any
  onChanged?: () => void
}

export function RegisterPanel({ event, config, myRegistration, onChanged }: Props) {
  const [pending, startTransition] = useTransition()
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [qrOpen, setQrOpen] = useState(false)

  const capacityFull = config?.capacity && (config.confirmed_count || 0) >= config.capacity
  const waitlistPossible = capacityFull && config?.waitlist_enabled
  const isCancelled = event.status === 'CANCELLED'
  const isEnded = event.status === 'ENDED' || event.status === 'ARCHIVED'
  const registrationOpen = event.status === 'REGISTRATION_OPEN' || event.status === 'SCHEDULED'
  const registrationClosed = !registrationOpen

  const register = () => {
    startTransition(async () => {
      const res = await fetch(`/api/v1/community/events/${event.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `evt-reg-${event.id}-${Date.now()}`,
        },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json?.error?.message || 'Registration failed'); return }
      const d = json?.data
      if (d?.qr_url) {
        // token is the last path segment
        const t = d.qr_url.split('/').pop()
        setQrToken(t || null)
      }
      toast.success(
        d?.already_registered
          ? 'You are already registered'
          : d?.status === 'CONFIRMED'
          ? "You're in!"
          : `Waitlist position: #${d?.waitlist_position ?? '?'}`
      )
      onChanged?.()
    })
  }

  const cancel = () => {
    if (!confirm('Cancel your registration?')) return
    startTransition(async () => {
      const res = await fetch(`/api/v1/community/events/registrations/${myRegistration.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'user_cancelled' }),
      })
      if (!res.ok) { toast.error('Cancel failed'); return }
      toast.message('Registration cancelled')
      onChanged?.()
    })
  }

  const fetchQrToken = async () => {
    setQrOpen(true)
    if (qrToken) return
    const res = await fetch(`/api/v1/community/events/${event.id}/registrations/self/qr`, { method: 'POST' })
    const json = await res.json()
    if (res.ok) setQrToken(json?.data?.token || null)
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5">
      {/* Capacity display */}
      {config?.capacity && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
            <span>Registered</span>
            <span className="text-white/80">
              {formatNumber(config.confirmed_count || 0)} / {formatNumber(config.capacity)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={cn(
                'h-full transition-all',
                capacityFull ? 'bg-amber-400/70' : 'bg-white'
              )}
              style={{ width: `${Math.min(100, ((config.confirmed_count || 0) / config.capacity) * 100)}%` }}
            />
          </div>
          {(config.waitlist_count || 0) > 0 && (
            <p className="mt-2 text-[10.5px] font-mono uppercase tracking-wider text-white/40">
              {formatNumber(config.waitlist_count)} on waitlist
            </p>
          )}
        </div>
      )}

      {/* Primary CTA */}
      {isCancelled ? (
        <button disabled className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 text-red-300 px-4 py-2.5 text-[13px] font-medium">
          <X className="w-3.5 h-3.5" strokeWidth={1.75} /> Event cancelled
        </button>
      ) : isEnded ? (
        <button disabled className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/40 px-4 py-2.5 text-[13px] font-medium">
          Event has ended
        </button>
      ) : myRegistration ? (
        <>
          {myRegistration.status === 'CONFIRMED' && (
            <>
              <div className="text-center rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-3 mb-3">
                <Check className="w-4 h-4 text-emerald-300 mx-auto mb-1" strokeWidth={2} />
                <p className="text-[13px] font-semibold text-white">You're in</p>
                {myRegistration.registration_number && (
                  <p className="mt-0.5 text-[11px] font-mono text-white/60">
                    {myRegistration.registration_number}
                  </p>
                )}
              </div>

              {config?.checkin_enabled && (
                <Dialog open={qrOpen} onOpenChange={setQrOpen}>
                  <DialogTrigger asChild>
                    <button
                      onClick={fetchQrToken}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-white text-black hover:bg-zinc-100 px-4 py-2 text-[12.5px] font-semibold transition-colors mb-2"
                    >
                      <QrCode className="w-3.5 h-3.5" strokeWidth={1.75} />
                      Show check-in QR
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0c0c12] border-white/[0.08] text-white max-w-sm sm:rounded-2xl p-6">
                    <div className="text-center space-y-4">
                      <div>
                        <p className="label-mono text-white/50">Check-in QR</p>
                        <p className="mt-1 text-[15px] font-semibold text-white">{event.title}</p>
                        <p className="mt-0.5 text-[11px] font-mono text-white/50">{myRegistration.registration_number}</p>
                      </div>
                      <div className="p-6 bg-white rounded-2xl inline-block">
                        {qrToken ? (
                          <QRCodeSVG value={typeof window !== 'undefined' ? `${window.location.origin}/checkin/${qrToken}` : qrToken} size={220} level="H" />
                        ) : (
                          <Loader2 className="w-6 h-6 animate-spin text-black" />
                        )}
                      </div>
                      <p className="text-[11px] text-white/50">
                        Show this at the venue. Refreshing this dialog issues a new token and invalidates the old one.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <button
                onClick={cancel}
                disabled={pending}
                className="w-full text-[11.5px] text-white/50 hover:text-white transition-colors py-2"
              >
                Cancel registration
              </button>
            </>
          )}

          {myRegistration.status === 'WAITLISTED' && (
            <>
              <div className="text-center rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 mb-3">
                <Clock className="w-4 h-4 text-amber-300 mx-auto mb-1" strokeWidth={2} />
                <p className="text-[13px] font-semibold text-white">You're on the waitlist</p>
                <p className="mt-0.5 text-[11px] text-white/60">
                  We'll notify you if a spot opens.
                </p>
              </div>
              <button
                onClick={cancel}
                disabled={pending}
                className="w-full text-[11.5px] text-white/50 hover:text-white transition-colors py-2"
              >
                Leave waitlist
              </button>
            </>
          )}
        </>
      ) : registrationClosed ? (
        <button disabled className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/50 px-4 py-2.5 text-[13px] font-medium">
          <Lock className="w-3.5 h-3.5" strokeWidth={1.75} /> Registration closed
        </button>
      ) : (
        <button
          onClick={register}
          disabled={pending}
          className={cn(
            'w-full inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-colors',
            capacityFull
              ? 'bg-white/[0.06] text-white/85 hover:bg-white/[0.1]'
              : 'bg-white text-black hover:bg-zinc-100'
          )}
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" strokeWidth={1.75} />}
          {capacityFull
            ? (waitlistPossible ? 'Join waitlist' : 'Event full')
            : 'Register'}
        </button>
      )}
    </div>
  )
}