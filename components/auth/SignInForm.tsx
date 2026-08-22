'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export function SignInForm({ onSwitchView }: Props) {
  const router = useRouter()
  const supabase = createClient()
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
          redirectTo: `${window.location.origin}/callback?next=/home` 
        }
      })
      if (error) throw error
    } catch (err: any) {
      toast.error(err.message || `Failed to connect to ${provider}`)
      setOauthLoading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (!data.user) throw new Error('Sign in failed')

      const { data: profile } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('id', data.user.id)
        .maybeSingle()

      toast.success('Welcome back!')
      router.refresh()
      router.push(profile?.onboarding_complete ? '/home' : '/onboarding')
    } catch (err: any) {
      toast.error('Incorrect email or password.')
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-[22px] font-bold text-white tracking-tight">Welcome back</h1>
        <p className="text-[13px] text-white/50 mt-1">Continue where you left off.</p>
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

      <AuthDivider />

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

        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showForgotLink
          onForgotClick={() => onSwitchView('forgot')}
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
              Sign in to DSRT
              <ArrowRight className="w-4 h-4" weight="bold" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-[13px] text-white/50 font-medium mt-6">
        New to DSRT?{' '}
        <button 
          onClick={() => onSwitchView('signup')} 
          className="text-[#4F7CFF] hover:text-[#7093FF] font-semibold transition-colors"
        >
          Create account
        </button>
      </p>
    </div>
  )
}