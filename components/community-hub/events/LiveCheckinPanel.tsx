'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { QrCode, CheckCircle2, Loader2, X, Camera, RefreshCcw } from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import { useEventAttendance } from '@/hooks/useEvents'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  eventId: string
}

export function LiveCheckinPanel({ eventId }: Props) {
  const [tokenInput, setTokenInput] = useState('')
  const [pending, startTransition] = useTransition()
  const [lastResult, setLastResult] = useState<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { items, reload } = useEventAttendance(eventId)

  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = (raw?: string) => {
    const t = (raw ?? tokenInput).trim()
    if (!t) return
    startTransition(async () => {
      const res = await fetch('/api/v1/events/checkin/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t, device_id: 'admin-desk' }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error?.message || 'Scan failed')
        setLastResult({ error: true, message: json?.error?.message })
      } else {
        const d = json?.data
        setLastResult(d)
        if (d.already_checked_in) toast.message(`Already checked in at ${new Date(d.checked_in_at).toLocaleTimeString()}`)
        else toast.success(`Checked in · #${d.registration_number || ''}`)
        reload()
      }
      setTokenInput('')
      inputRef.current?.focus()
    })
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_360px]">
      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6">
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="w-4 h-4 text-white/70" strokeWidth={1.75} />
          <p className="label-mono text-white/60">Live check-in</p>
        </div>
        <p className="text-[13px] text-white/70 mb-4">
          Focus the input and scan attendee QR codes. Duplicate scans are shown but never double-count.
        </p>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
            placeholder="Scan or paste check-in token…"
            className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.02] focus:border-white/[0.18] outline-none px-3 py-2.5 text-[13px] text-white placeholder:text-white/30 font-mono"
          />
          <button
            onClick={() => submit()}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full bg-white text-black hover:bg-zinc-100 px-4 py-2 text-[12px] font-semibold transition-colors"
          >
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" strokeWidth={1.75} />}
            Check in
          </button>
        </div>

        {lastResult && !lastResult.error && (
          <div className="mt-4 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.05] p-3 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" strokeWidth={1.75} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-white">
                {lastResult.already_checked_in ? 'Already checked in' : 'Checked in'} · #{lastResult.registration_number}
              </p>
              <p className="text-[11px] text-white/55 font-mono">
                {new Date(lastResult.checked_in_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
        {lastResult?.error && (
          <div className="mt-4 rounded-lg border border-red-500/25 bg-red-500/[0.05] p-3 flex items-center gap-3">
            <X className="w-5 h-5 text-red-300" strokeWidth={1.75} />
            <p className="text-[13px] text-white/80">{lastResult.message || 'Scan failed'}</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="label-mono text-white/60">Recent check-ins ({items.length})</p>
          <button onClick={reload} className="text-white/50 hover:text-white transition-colors">
            <RefreshCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
        <ul className="space-y-2 max-h-[420px] overflow-y-auto">
          {items.length === 0 ? (
            <li className="text-[12px] text-white/40 text-center py-8">No check-ins yet.</li>
          ) : (
            items.slice(0, 40).map((a: any) => (
              <li key={a.id} className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] p-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] text-white truncate">{a.user?.full_name || 'Anonymous'}</p>
                  <p className="text-[10.5px] font-mono text-white/40">
                    {formatDistanceToNow(new Date(a.checked_in_at), { addSuffix: true })}
                    {a.checkin_count > 1 && ` · ${a.checkin_count} scans`}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}