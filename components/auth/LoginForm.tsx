'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { At, ArrowRight } from '@phosphor-icons/react'
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
          label="Email or username"
          type="text"
          name="identifier"
          autoComplete="username"
          autoFocus
          placeholder="alex@example.com or username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <div className="space-y-1">
          <PasswordInput
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onSwitchView('forgot')}
              className="text-[12px] text-white/50 hover:text-white transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>

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