'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { At, CircleNotch, ArrowRight } from '@phosphor-icons/react'
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
    if (!identifier || !password) return toast.error('Please enter your credentials')

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')

      // Restore client session
      const clean = identifier.trim().toLowerCase()
      let loginEmail = clean
      if (!clean.includes('@')) {
        // Client-side we don't have email; use API's implicit session cookie
        // Force a page refresh to sync state
        router.refresh()
        router.push(data.next || '/home')
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email: loginEmail, password })
      if (signInError) throw signInError

      router.push(data.next || '/home')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-[22px] font-semibold text-white tracking-tight">Welcome back</h1>
        <p className="text-[13px] text-white/50 mt-1">Sign in to continue building on DSRT.</p>
      </div>

      <div className="space-y-2">
        <OAuthButton provider="google" onClick={() => handleOAuth('google')} loading={oauthLoading === 'google'} disabled={!!oauthLoading} icon={<GoogleIcon />}>
          Continue with Google
        </OAuthButton>
        <OAuthButton provider="github" onClick={() => handleOAuth('github')} loading={oauthLoading === 'github'} disabled={!!oauthLoading} icon={<GithubIcon />}>
          Continue with GitHub
        </OAuthButton>
      </div>

      <AuthDivider label="or with password" />

      <form onSubmit={handleSubmit} className="space-y-3">
        <AuthInput
          label="Email or username"
          type="text"
          name="identifier"
          autoComplete="username"
          autoFocus
          placeholder="you@example.com or @jisu"
          leading={<At className="w-4 h-4" weight="regular" />}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onSwitchView('forgot')}
            className="text-[12px] text-white/50 hover:text-white/80 transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full h-10 rounded-md mt-1 flex items-center justify-center gap-2",
            "bg-[#4F7CFF] hover:bg-[#3D6BF5] text-white text-[13px] font-semibold",
            "transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          {loading ? <CircleNotch className="w-4 h-4 animate-spin" /> : <>Sign in <ArrowRight className="w-3.5 h-3.5" weight="bold" /></>}
        </button>
      </form>

      <p className="text-center text-[13px] text-white/50 mt-6">
        New to DSRT?{' '}
        <button onClick={() => onSwitchView('signup')} className="text-[#4F7CFF] hover:text-[#7093FF] font-medium transition-colors">
          Create account
        </button>
      </p>
    </div>
  )
}