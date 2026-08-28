'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
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
  const [confirmPassword, setConfirmPassword] = useState('')
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
    
    if (!fullName || !email || !password || !confirmPassword) {
      return toast.error('Please fill in all required fields')
    }
    if (password.length < 8) {
      return toast.error('Password must be at least 8 characters')
    }
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match')
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Signup failed')

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError

      toast.success("Account created! Let's claim your DSRT identity.")
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
          placeholder="Alex Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <AuthInput
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="alex@example.com"
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

        <PasswordInput
          label="Confirm Password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full h-9 rounded-md mt-2 flex items-center justify-center transition-colors",
            "bg-white text-black text-[14px] font-semibold hover:bg-white/90",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-black" />
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <p className="text-center text-[13px] text-white/50 font-medium mt-6">
        Already have an account?{' '}
        <button onClick={() => onSwitchView('signin')} className="text-white hover:underline transition-colors font-medium">
          Sign in
        </button>
      </p>
    </div>
  )
}