'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { At, User, CircleNotch, ArrowRight, Calendar } from '@phosphor-icons/react'
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
  onVerify?: (email: string) => void
}

export function SignUpForm({ onSwitchView }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dob, setDob] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null)

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/callback?next=/auth/username` }
      })
      if (error) throw error
    } catch (err: any) {
      toast.error(err.message)
      setOauthLoading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email || !password) return toast.error('Please fill in all required fields')
    if (password.length < 8) return toast.error('Password must be at least 8 characters')

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, dob: dob || null })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Signup failed')

      // Sign in immediately to establish session
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError

      toast.success('Account created! Let\'s claim your DSRT identity.')
      router.push('/auth/username')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account')
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-[22px] font-bold text-white tracking-tight">Create your DSRT account</h1>
        <p className="text-[13px] text-white/50 mt-1">Build. Connect. Ship.</p>
      </div>

      <div className="space-y-2.5">
        <OAuthButton provider="google" onClick={() => handleOAuth('google')} loading={oauthLoading === 'google'} disabled={!!oauthLoading} icon={<GoogleIcon />}>
          Continue with Google
        </OAuthButton>
        <OAuthButton provider="github" onClick={() => handleOAuth('github')} loading={oauthLoading === 'github'} disabled={!!oauthLoading} icon={<GithubIcon />}>
          Continue with GitHub
        </OAuthButton>
      </div>

      <AuthDivider label="or with email" />

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <AuthInput
          label="Full Name"
          name="fullName"
          autoComplete="name"
          autoFocus
          placeholder="Jisu Mondal"
          leading={<User className="w-4 h-4" weight="bold" />}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <AuthInput
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          leading={<At className="w-4 h-4" weight="bold" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <PasswordInput
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="text-[12px] font-semibold text-white/70 pl-1">Date of Birth (optional)</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
              <Calendar className="w-4 h-4" weight="bold" />
            </div>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full h-11 pl-10 pr-3 rounded-lg bg-[#0A0D14] border border-white/10 text-white text-sm focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF] transition-all"
            />
          </div>
        </div>

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
          {loading ? (
            <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
          ) : (
            <>Create account <ArrowRight className="w-4 h-4" weight="bold" /></>
          )}
        </button>
      </form>

      <p className="text-center text-[13px] text-white/50 font-medium mt-6">
        Already have an account?{' '}
        <button onClick={() => onSwitchView('signin')} className="text-[#4F7CFF] hover:text-[#7093FF] font-semibold transition-colors">
          Sign in
        </button>
      </p>

      <p className="text-center text-[10px] text-white/30 mt-3">
        By continuing, you agree to DSRT's Terms and Privacy Policy.
      </p>
    </div>
  )
}