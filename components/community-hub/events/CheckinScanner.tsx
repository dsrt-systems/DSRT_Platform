'use client'

import { useEffect, useState } from 'react'
import { Check, X, Loader2, AlertCircle, QrCode } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  token: string
}

export function CheckinScanner({ token }: Props) {
  const [state, setState] = useState<'checking' | 'ok' | 'already' | 'error'>('checking')
  const [details, setDetails] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch('/api/v1/community/events/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, method: 'QR' }),
        })
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setError(json?.error?.message || 'Check-in failed')
          setState('error')
          return
        }
        setDetails(json?.data)
        setState(json?.data?.already_checked_in ? 'already' : 'ok')
      } catch (e: any) {
        if (!cancelled) { setError('Network error'); setState('error') }
      }
    }
    run()
    return () => { cancelled = true }
  }, [token])

  const tone: Record<string, string> = {
    checking: 'border-white/[0.08] bg-white/[0.02]',
    ok: 'border-emerald-500/25 bg-emerald-500/[0.06]',
    already: 'border-blue-500/25 bg-blue-500/[0.06]',
    error: 'border-red-500/25 bg-red-500/[0.06]',
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className={cn('w-full max-w-sm rounded-3xl border p-6 text-center', tone[state])}>
        <div className="mx-auto w-16 h-16 rounded-full border border-white/[0.14] bg-white/[0.06] flex items-center justify-center mb-4">
          {state === 'checking' && <Loader2 className="w-6 h-6 animate-spin text-white/70" />}
          {state === 'ok' && <Check className="w-6 h-6 text-emerald-300" strokeWidth={2.5} />}
          {state === 'already' && <QrCode className="w-6 h-6 text-blue-300" strokeWidth={1.75} />}
          {state === 'error' && <AlertCircle className="w-6 h-6 text-red-300" strokeWidth={1.75} />}
        </div>

        {state === 'checking' && (
          <>
            <h1 className="text-[15px] font-semibold text-white">Verifying check-in…</h1>
            <p className="mt-2 text-[12px] text-white/50">Please wait.</p>
          </>
        )}

        {state === 'ok' && (
          <>
            <h1 className="text-[16px] font-semibold text-white">Checked in</h1>
            {details?.registration_number && (
              <p className="mt-1 text-[12px] font-mono text-white/70">{details.registration_number}</p>
            )}
            <p className="mt-2 text-[11px] text-white/50">
              {format(new Date(), 'MMM d · h:mm a')}
            </p>
          </>
        )}

        {state === 'already' && (
          <>
            <h1 className="text-[16px] font-semibold text-white">Already checked in</h1>
            {details?.checked_in_at && (
              <p className="mt-1 text-[11.5px] font-mono text-white/60">
                {format(new Date(details.checked_in_at), 'MMM d · h:mm a')}
              </p>
            )}
            {details?.registration_number && (
              <p className="mt-2 text-[12px] font-mono text-white/70">{details.registration_number}</p>
            )}
          </>
        )}

        {state === 'error' && (
          <>
            <h1 className="text-[16px] font-semibold text-white">Check-in failed</h1>
            <p className="mt-2 text-[12px] text-white/60">{error}</p>
          </>
        )}

        <div className="mt-6">
          <Link href="/" className="text-[11.5px] text-white/50 hover:text-white transition-colors">
            Return to DSRT
          </Link>
        </div>
      </div>
    </div>
  )
}