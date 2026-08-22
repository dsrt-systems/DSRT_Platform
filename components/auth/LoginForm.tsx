'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { GithubLogo, GoogleLogo, Spinner } from '@phosphor-icons/react'

export function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/callback`
        }
      })
      if (error) throw error
    } catch (err: any) {
      toast.error(err.message || `Failed to connect to ${provider}`)
      setOauthLoading(null)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please enter email and password')
    
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (!data.user) throw new Error('Login failed')

      const { data: profile } = await supabase.from('users').select('onboarding_complete').eq('id', data.user.id).single()
      
      router.refresh()
      if (!profile?.onboarding_complete) router.push('/onboarding')
      else router.push('/home')
      
    } catch (err: any) {
      toast.error(err.message || 'Invalid login credentials')
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    if (!email) return toast.error('Please enter your email address first.')
    toast.success('Password reset link sent to ' + email)
    // Add real supabase reset logic here later
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-[380px] flex flex-col"
    >
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-white tracking-tight mb-2">Welcome back</h1>
        <p className="text-[14px] text-white/50">Log in to DSRT to continue building.</p>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => handleOAuth('google')}
          disabled={!!oauthLoading}
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-lg border border-white/[0.1] hover:bg-white/[0.04] bg-white/[0.02] text-[13px] font-semibold text-white transition-all disabled:opacity-50"
        >
          {oauthLoading === 'google' ? <Spinner className="w-4 h-4 animate-spin" /> : <GoogleLogo className="w-4 h-4" weight="bold" />}
          Google
        </button>
        <button 
          onClick={() => handleOAuth('github')}
          disabled={!!oauthLoading}
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-lg border border-white/[0.1] hover:bg-white/[0.04] bg-white/[0.02] text-[13px] font-semibold text-white transition-all disabled:opacity-50"
        >
          {oauthLoading === 'github' ? <Spinner className="w-4 h-4 animate-spin" /> : <GithubLogo className="w-4 h-4" weight="fill" />}
          GitHub
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-white/[0.06]" />
        <span className="text-[11px] uppercase tracking-wider text-white/30 font-bold">Or continue with</span>
        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[12px] font-semibold text-white/70 pl-1">Email address</label>
          <input
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@dsrt.com or you@example.com"
            className="w-full h-11 px-4 rounded-lg bg-[#0a0a0f] border border-white/[0.1] text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-semibold text-white/70 pl-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full h-11 px-4 rounded-lg bg-[#0a0a0f] border border-white/[0.1] text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
          />
        </div>

        <div className="flex items-center justify-between pt-1 pb-3 px-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" className="w-3.5 h-3.5 rounded border-white/20 bg-transparent text-indigo-500 focus:ring-indigo-500/30 focus:ring-offset-0 cursor-pointer" />
            <span className="text-[12px] text-white/50 group-hover:text-white/70 transition-colors font-medium">Remember me</span>
          </label>
          <button type="button" onClick={handleForgotPassword} className="text-[12px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Forgot password?
          </button>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full h-11 rounded-lg bg-white hover:bg-zinc-200 text-black text-[14px] font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <Spinner className="w-5 h-5 animate-spin" /> : 'Log in'}
        </button>
      </form>

      <p className="mt-8 text-center text-[13px] text-white/50 font-medium">
        Don't have an account?{' '}
        <Link href="/signup" className="text-white hover:text-indigo-300 font-bold transition-colors">
          Sign up
        </Link>
      </p>
    </motion.div>
  )
}