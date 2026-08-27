'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PromptState {
  show: boolean
  context?: string
  message?: string
  readiness_score?: number
  trust_level?: string
  email?: string
}

export function VerificationBanner() {
  const [state, setState] = useState<PromptState | null>(null)
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fetchState = async () => {
      try {
        const res = await fetch('/api/auth/verification-prompt')
        const data = await res.json()
        if (!cancelled && data.show) {
          setState(data)
          // Record that we showed it
          fetch('/api/auth/verification-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context: data.context, action: 'SHOWN' })
          }).catch(() => {})
        }
      } catch {}
    }
    fetchState()
    return () => { cancelled = true }
  }, [])

  const handleVerify = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/verification-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: state?.context, action: 'CLICKED' })
      })

      const res = await fetch('/api/auth/request-verification', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success('Verification email queued. Check your inbox shortly.')
      setDismissed(true)
    } catch (err: any) {
      toast.error(err.message || 'Could not send verification email')
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async () => {
    setDismissed(true)
    fetch('/api/auth/verification-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: state?.context, action: 'DISMISSED' })
    }).catch(() => {})
  }

  if (!state?.show || dismissed) return null

  return (
    <div className="border border-white/[0.06] bg-[#0A0D14] rounded-lg px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-md bg-[#4F7CFF]/10 border border-[#4F7CFF]/20 flex items-center justify-center flex-shrink-0">
        <CheckCircle className="w-4 h-4 text-[#4F7CFF]" weight="regular" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-white/90 font-medium leading-snug">{state.message}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleVerify}
          disabled={loading}
          className={cn(
            "h-8 px-3 rounded-md text-[12px] font-semibold transition-all",
            "bg-[#4F7CFF] hover:bg-[#3D6BF5] text-white",
            "disabled:opacity-60"
          )}
        >
          {loading ? 'Sending...' : 'Verify email'}
        </button>
        <button
          onClick={handleDismiss}
          className="w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" weight="bold" />
        </button>
      </div>
    </div>
  )
}