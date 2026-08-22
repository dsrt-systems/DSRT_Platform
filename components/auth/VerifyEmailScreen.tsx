'use client'

import { useState, useEffect } from 'react'
import { EnvelopeSimple, ArrowLeft } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { AuthView } from './AuthShell'

interface Props {
  email: string
  onSwitchView: (view: AuthView) => void
}

export function VerifyEmailScreen({ email, onSwitchView }: Props) {
  const supabase = createClient()
  const [cooldown, setCooldown] = useState(0)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleResend = async () => {
    if (cooldown > 0) return
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) throw error
      toast.success('Verification email sent!')
      setCooldown(45)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div>
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-[#4F7CFF]/10 border border-[#4F7CFF]/30 flex items-center justify-center mx-auto mb-5">
          <EnvelopeSimple className="w-7 h-7 text-[#4F7CFF]" weight="bold" />
        </div>
        <h1 className="text-[22px] font-bold text-white tracking-tight">Verify your email</h1>
        <p className="text-[13px] text-white/60 mt-2 leading-relaxed max-w-[320px] mx-auto">
          We sent a verification link to
        </p>
        <p className="text-[14px] text-white font-semibold mt-1">{email}</p>
      </div>

      <div className="mt-6 space-y-3">
        <button
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="w-full h-11 rounded-lg border border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.05] text-white text-[13px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resending 
            ? 'Sending...' 
            : cooldown > 0 
              ? `Resend available in ${cooldown}s` 
              : 'Resend verification email'
          }
        </button>

        <button 
          onClick={() => onSwitchView('signin')}
          className="w-full h-11 rounded-lg text-white/60 hover:text-white text-[13px] font-medium transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" weight="bold" />
          Back to sign in
        </button>
      </div>
    </div>
  )
}