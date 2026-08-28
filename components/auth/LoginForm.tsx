'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, KeyRound, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthInput } from './AuthInput'
import { PasswordInput } from './PasswordInput'
import { OAuthButton } from './OAuthButton'
import { AuthDivider } from './AuthDivider'
import { GoogleIcon, GithubIcon } from './ProviderIcons'
import { cn } from '@/lib/utils'
import type { AuthView } from './AuthShell'

interface Props {
  onSwitchView: (view: AuthView) => void
}

export function LoginForm({ onSwitchView }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [mode, setMode] = useState<'password' | 'pin'>('password')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null)

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/callback` }
      })
      if (error) throw error
    } catch (err: any) {
      toast.error(err.message)
      setOauthLoading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'password') {
      await handlePasswordLogin()
    } else {
      await handlePinLogin()
    }
  }

  const handlePasswordLogin = async () => {
    if (!identifier || !password) return toast.error('Enter your credentials')

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')

      const clean = identifier.trim().toLowerCase()
      let loginEmail = clean
      if (!clean.includes('@')) {
        router.refresh()
        router.push(data.next || '/home')
        return
      }

      await supabase.auth.signInWithPassword({ email: loginEmail, password })
      router.push(data.next || '/home')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
      setLoading(false)
    }
  }

  const handlePinLogin = async () => {
    if (!identifier || !pin) return toast.error('Enter your email and PIN')
    if (!identifier.includes('@')) return toast.error('Enter your email address (not username) for PIN login')
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) return toast.error('PIN must be 6 digits')

    setLoading(true)
    try {
      const res = await fetch('/api/auth/pin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier.trim().toLowerCase(), pin })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'PIN login failed')

      // Use magic link token to establish session
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        type: 'magiclink',
        token_hash: data.token_hash,
      })

      if (verifyErr) throw verifyErr

      router.push('/home')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'PIN login failed')
      setLoading(false)
    }
  }

  const togglePinMode = () => {
    setMode(mode === 'password' ? 'pin' : 'password')
    setPin('')
    setPassword('')
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-white tracking-tight">Welcome back</h1>
        <p className="text-[14px] text-white/60 mt-1.5">Sign in to your DSRT account.</p>
      </div>

      <div className="space-y-2 mb-6">
        <OAuthButton provider="google" onClick={() => handleOAuth('google')} loading={oauthLoading === 'google'} disabled={!!oauthLoading} icon={<GoogleIcon />}>
          Continue with Google
        </OAuthButton>
        <OAuthButton provider="github" onClick={() => handleOAuth('github')} loading={oauthLoading === 'github'} disabled={!!oauthLoading} icon={<GithubIcon />}>
          Continue with GitHub
        </OAuthButton>
      </div>

      <AuthDivider label="or continue with email" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          label={mode === 'pin' ? 'Email' : 'Email or username'}
          type="text"
          name="identifier"
          autoComplete="username"
          autoFocus
          placeholder={mode === 'pin' ? 'alex@example.com' : 'alex@example.com or username'}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        {mode === 'password' ? (
          <div className="space-y-1">
            <PasswordInput
              label="Password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={togglePinMode}
                className="text-[12px] text-[#4F7CFF] hover:text-[#7093FF] font-medium flex items-center gap-1 transition-colors"
              >
                <KeyRound className="w-3 h-3" />
                Sign in with DSRT PIN
              </button>
              <button
                type="button"
                onClick={() => onSwitchView('forgot')}
                className="text-[12px] text-white/50 hover:text-white transition-colors"
              >
                Forgot password?
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="space-y-1.5 flex w-full flex-col">
              <label className="text-[13px] font-medium text-white/90">DSRT PIN</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit PIN"
                className={cn(
                  "w-full h-9 px-3 rounded-md bg-transparent border border-white/15 text-white text-[14px] font-mono tracking-widest text-center",
                  "placeholder:text-white/30 placeholder:tracking-normal placeholder:font-sans",
                  "focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF]",
                  "transition-all"
                )}
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={togglePinMode}
                className="text-[12px] text-[#4F7CFF] hover:text-[#7093FF] font-medium flex items-center gap-1 transition-colors"
              >
                <Lock className="w-3 h-3" />
                Sign in with password
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full h-9 rounded-md mt-2 flex items-center justify-center transition-colors",
            "bg-white text-black text-[14px] font-semibold hover:bg-white/90",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : 'Sign in'}
        </button>
      </form>

      <p className="text-[13px] text-white/60 mt-6">
        New to DSRT?{' '}
        <button onClick={() => onSwitchView('signup')} className="text-white hover:underline transition-colors font-medium">
          Create account
        </button>
      </p>
    </div>
  )
}