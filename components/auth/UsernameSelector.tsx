'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CircleNotch, CheckCircle, XCircle, ArrowRight, Sparkle, EnvelopeSimple } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export function UsernameSelector({ initialFullName, initialEmail }: { initialFullName?: string; initialEmail?: string }) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [availability, setAvailability] = useState<{ available: boolean; reason?: string; dsrt_email?: string } | null>(null)
  const [checking, setChecking] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Load initial suggestions
  useEffect(() => {
    if (!initialFullName && !initialEmail) return
    loadSuggestions(initialEmail?.split('@')[0] || initialFullName?.toLowerCase().replace(/\s+/g, '') || 'builder')
  }, [initialFullName, initialEmail])

  const loadSuggestions = async (seed: string) => {
    setLoadingSuggestions(true)
    try {
      const res = await fetch('/api/auth/username/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed,
          fullName: initialFullName,
          interests: [],
          count: 6
        })
      })
      const data = await res.json()
      if (data.suggestions) setSuggestions(data.suggestions)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Debounced availability check
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (username.length < 3) {
      setAvailability(null)
      return
    }
    setChecking(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/username/check?username=${encodeURIComponent(username)}`)
        const data = await res.json()
        setAvailability(data)
      } catch {
        setAvailability({ available: false, reason: 'Check failed' })
      } finally {
        setChecking(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [username])

  const handleUsernameChange = (val: string) => {
    setUsername(val.toLowerCase().replace(/[^a-z0-9._]/g, ''))
  }

  const pickSuggestion = (s: string) => {
    setUsername(s)
  }

  const claimIdentity = async () => {
    if (!availability?.available) return
    setClaiming(true)
    try {
      const res = await fetch('/api/auth/identity/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to claim identity')
      
      toast.success(`Welcome, @${data.username}!`)
      router.push('/onboarding')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to claim identity')
      // Refresh availability to get new state
      if (username.length >= 3) {
        const res = await fetch(`/api/auth/username/check?username=${encodeURIComponent(username)}`)
        setAvailability(await res.json())
      }
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="w-full max-w-[440px] mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#4F7CFF]/10 border border-[#4F7CFF]/30 flex items-center justify-center">
          <Sparkle className="w-6 h-6 text-[#4F7CFF]" weight="fill" />
        </div>
        <h1 className="text-[26px] font-bold text-white tracking-tight">Claim your DSRT identity</h1>
        <p className="text-[13px] text-white/50 mt-2 max-w-xs mx-auto">
          Choose a permanent username. This becomes your public DSRT identity and email.
        </p>
      </div>

      {/* Username Input */}
      <div className="mb-6">
        <label className="text-[12px] font-semibold text-white/70 mb-1.5 block">Username</label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 font-mono text-[15px]">@</div>
          <input
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder="jisu"
            maxLength={30}
            autoFocus
            className={cn(
              "w-full h-12 pl-9 pr-12 rounded-xl bg-[#0A0D14] border text-white font-mono text-[15px]",
              "focus:outline-none focus:ring-2 transition-all",
              availability?.available ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20" :
              availability && !availability.available ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" :
              "border-white/10 focus:border-[#4F7CFF] focus:ring-[#4F7CFF]/20"
            )}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {checking && <CircleNotch className="w-5 h-5 text-white/40 animate-spin" />}
            {!checking && availability?.available && <CheckCircle className="w-5 h-5 text-emerald-400" weight="fill" />}
            {!checking && availability && !availability.available && <XCircle className="w-5 h-5 text-red-400" weight="fill" />}
          </div>
        </div>

        {/* Status */}
        {username.length >= 3 && !checking && availability && (
          <div className={cn(
            "mt-2 text-[12px] font-medium flex items-center gap-1.5",
            availability.available ? "text-emerald-400" : "text-red-400"
          )}>
            {availability.available ? '✓ Available' : `✗ ${availability.reason}`}
          </div>
        )}

        {/* DSRT Email preview */}
        {availability?.available && availability.dsrt_email && (
          <div className="mt-3 p-3 rounded-lg bg-[#4F7CFF]/5 border border-[#4F7CFF]/20 flex items-center gap-2.5">
            <EnvelopeSimple className="w-4 h-4 text-[#4F7CFF] flex-shrink-0" weight="fill" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold mb-0.5">Your DSRT Mail</p>
              <p className="text-[13px] text-white font-mono truncate">{availability.dsrt_email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-wider text-white/40 font-bold mb-2.5">
          {loadingSuggestions ? 'Generating suggestions...' : 'Suggestions for you'}
        </p>
        {loadingSuggestions ? (
          <div className="grid grid-cols-2 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => pickSuggestion(s)}
                className={cn(
                  "h-9 px-3 rounded-lg text-left text-[13px] font-mono transition-all truncate",
                  "bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.15]",
                  "text-white/70 hover:text-white",
                  username === s && "bg-[#4F7CFF]/10 border-[#4F7CFF]/40 text-[#4F7CFF]"
                )}
              >
                @{s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Claim Button */}
      <button
        onClick={claimIdentity}
        disabled={!availability?.available || claiming || checking}
        className={cn(
          "w-full h-12 rounded-xl flex items-center justify-center gap-2 transition-all",
          "bg-[#4F7CFF] hover:bg-[#3D6BF5] text-white text-[15px] font-bold",
          "shadow-[0_4px_20px_rgba(79,124,255,0.3)]",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#4F7CFF]"
        )}
      >
        {claiming ? <CircleNotch className="w-5 h-5 animate-spin" /> : (
          <>Claim @{username || 'username'} <ArrowRight className="w-4 h-4" weight="bold" /></>
        )}
      </button>

      <p className="text-center text-[10px] text-white/30 mt-4">
        Your username is permanent and cannot be easily changed. Choose wisely.
      </p>
    </div>
  )
}