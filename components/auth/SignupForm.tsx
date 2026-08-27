'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { At, User, CircleNotch, ArrowRight } from '@phosphor-icons/react'
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
  onVerify: (email: string) => void
}

export function SignUpForm({ onSwitchView, onVerify }: Props) {
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null)

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { 
          redirectTo: `${window.location.origin}/callback?next=/onboarding` 
        }
      })
      if (error) throw error
    } catch (err: any) {
      toast.error(err.message)
      setOauthLoading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email || !password) return toast.error('All fields are required')
    if (password.length < 8) return toast.error('Password must be at least 8 characters')

    setLoading(true)
    try {
      // Call our backend endpoint to handle user creation, OTP generation, and email dispatch
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create account')

      toast.success('Account created! Check your email for the 6-digit verification code.')
      onVerify(email)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-[22px] font-bold text-white tracking-tight">Create your account</h1>
        <p className="text-[13px] text-white/50 mt-1">Join the DSRT builder ecosystem.</p>
      </div>

      <div className="space-y-2.5">
        <OAuthButton 
          provider="google" 
          onClick={() => handleOAuth('google')} 
          loading={oauthLoading === 'google'}
          disabled={!!oauthLoading}
          icon={<GoogleIcon />}
        >
          Continue with Google
        </OAuthButton>
        <OAuthButton 
          provider="github" 
          onClick={() => handleOAuth('github')} 
          loading={oauthLoading === 'github'}
          disabled={!!oauthLoading}
          icon={<GithubIcon />}
        >
          Continue with GitHub
        </OAuthButton>
      </div>

      <AuthDivider label="or use email" />

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
          placeholder="name@example.com"
          leading={<At className="w-4 h-4" weight="bold" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <PasswordInput
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder="Minimum 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          {loading ? (
            <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
          ) : (
            <>
              Create account
              <ArrowRight className="w-4 h-4" weight="bold" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-[13px] text-white/50 font-medium mt-6">
        Already have an account?{' '}
        <button 
          onClick={() => onSwitchView('signin')} 
          className="text-[#4F7CFF] hover:text-[#7093FF] font-semibold transition-colors"
        >
          Sign in
        </button>
      </p>
    </div>
  )
}