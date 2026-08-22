'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { At, CircleNotch, ArrowLeft } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { AuthInput } from './AuthInput'
import { cn } from '@/lib/utils'
import type { AuthView } from './AuthShell'

interface Props {
  onSwitchView: (view: AuthView) => void
}

export function ForgotPasswordForm({ onSwitchView }: Props) {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error('Please enter your email')

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
      setSent(true)
    } catch (err: any) {
      // Generic message to avoid account enumeration
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <At className="w-6 h-6 text-emerald-400" weight="bold" />
          </div>
          <h1 className="text-[20px] font-bold text-white tracking-tight">Check your email</h1>
          <p className="text-[13px] text-white/60 mt-2 leading-relaxed max-w-[300px] mx-auto">
            If an account exists for <span className="text-white/80 font-semibold">{email}</span>, we've sent a secure reset link.
          </p>
        </div>

        <button 
          onClick={() => onSwitchView('signin')}
          className="w-full h-11 rounded-lg mt-6 flex items-center justify-center gap-2 border border-white/[0.1] hover:bg-white/[0.04] text-white text-[13px] font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" weight="bold" />
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-[22px] font-bold text-white tracking-tight">Reset your password</h1>
        <p className="text-[13px] text-white/50 mt-1 max-w-[320px] mx-auto">
          Enter your email and we'll send a secure reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          autoFocus
          placeholder="name@example.com"
          leading={<At className="w-4 h-4" weight="bold" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full h-11 rounded-lg mt-2 flex items-center justify-center gap-2",
            "bg-[#4F7CFF] hover:bg-[#3D6BF5] text-white text-[14px] font-bold",
            "shadow-[0_4px_20px_rgba(79,124,255,0.3)] transition-all",
            "disabled:opacity-70 disabled:cursor-not-allowed"
          )}
        >
          {loading ? <CircleNotch className="w-5 h-5 animate-spin" weight="bold" /> : 'Send reset link'}
        </button>
      </form>

      <button 
        onClick={() => onSwitchView('signin')} 
        className="w-full mt-4 text-center text-[13px] text-white/50 hover:text-white/80 font-medium transition-colors flex items-center justify-center gap-1.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to sign in
      </button>
    </div>
  )
}