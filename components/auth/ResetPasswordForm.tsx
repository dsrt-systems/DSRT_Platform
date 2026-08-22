'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CircleNotch, LockKey, CheckCircle } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { PasswordInput } from './PasswordInput'
import { DsrtLogo } from '@/components/ui/DsrtLogo'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export function ResetPasswordForm() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    // Supabase sets session from the recovery link hash/query
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setReady(true)
      } else {
        // Give auth listener a moment for hash tokens
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
            setReady(true)
          }
        })
        setTimeout(() => {
          supabase.auth.getSession().then(({ data }) => {
            if (!data.session) setInvalid(true)
            else setReady(true)
          })
        }, 1500)
        return () => subscription.unsubscribe()
      }
    }
    check()
  }, [supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) return toast.error('Password must be at least 8 characters')
    if (password !== confirm) return toast.error('Passwords do not match')

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      toast.success('Password updated')
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password')
      setLoading(false)
    }
  }

  if (invalid) {
    return (
      <div className="w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-[rgba(10,14,24,0.72)] backdrop-blur-2xl p-8 text-center">
        <DsrtLogo size={36} showText={false} className="justify-center mb-5" />
        <h1 className="text-[20px] font-bold text-white mb-2">Link expired</h1>
        <p className="text-[13px] text-white/50 mb-6">
          This reset link is invalid or has expired. Request a new one.
        </p>
        <Link
          href="/login"
          className="inline-flex h-11 px-6 items-center justify-center rounded-lg bg-[#4F7CFF] text-white text-[13px] font-bold"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-[rgba(10,14,24,0.72)] backdrop-blur-2xl p-12 flex items-center justify-center">
        <CircleNotch className="w-6 h-6 animate-spin text-white/50" />
      </div>
    )
  }

  if (done) {
    return (
      <div className="w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-[rgba(10,14,24,0.72)] backdrop-blur-2xl p-8 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" weight="fill" />
        <h1 className="text-[20px] font-bold text-white mb-2">Password updated</h1>
        <p className="text-[13px] text-white/50">Redirecting you to sign in…</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-[rgba(10,14,24,0.72)] backdrop-blur-2xl p-8">
      <div className="flex justify-center mb-6">
        <DsrtLogo size={36} showText={false} />
      </div>
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-[#4F7CFF]/10 border border-[#4F7CFF]/25 flex items-center justify-center mx-auto mb-4">
          <LockKey className="w-5 h-5 text-[#4F7CFF]" weight="bold" />
        </div>
        <h1 className="text-[20px] font-bold text-white tracking-tight">Set new password</h1>
        <p className="text-[13px] text-white/50 mt-1">Choose a strong password for your DSRT account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput
          label="New password"
          name="password"
          autoComplete="new-password"
          autoFocus
          placeholder="Minimum 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordInput
          label="Confirm password"
          name="confirm"
          autoComplete="new-password"
          placeholder="Repeat password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className={cn(
            'w-full h-11 rounded-lg flex items-center justify-center gap-2',
            'bg-[#4F7CFF] hover:bg-[#3D6BF5] text-white text-[14px] font-bold',
            'disabled:opacity-70'
          )}
        >
          {loading ? <CircleNotch className="w-5 h-5 animate-spin" /> : 'Update password'}
        </button>
      </form>
    </div>
  )
}