'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (slug: string) => void
  onValidityChange?: (valid: boolean) => void
}

export function SlugAvailabilityInput({ value, onChange, onValidityChange }: Props) {
  const [state, setState] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [reason, setReason] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!value) {
      setState('idle')
      setReason(null)
      onValidityChange?.(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setState('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/v1/communities/slugs/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: value }),
        })
        const json = await res.json()
        const data = json?.data
        if (data?.available) {
          setState('available')
          setReason(null)
          onValidityChange?.(true)
        } else if (data?.reason && !data?.available) {
          setState(data.slug === value.toLowerCase() ? 'taken' : 'invalid')
          setReason(data.reason)
          onValidityChange?.(false)
        }
      } catch {
        setState('idle')
      }
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, onValidityChange])

  const iconEl = useMemo(() => {
    if (state === 'checking') return <Loader2 className="w-3.5 h-3.5 animate-spin text-white/40" />
    if (state === 'available') return <Check className="w-3.5 h-3.5 text-emerald-300" strokeWidth={2} />
    if (state === 'taken' || state === 'invalid') return <X className="w-3.5 h-3.5 text-red-300" strokeWidth={2} />
    return null
  }, [state])

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] focus-within:border-white/[0.18] transition-colors">
        <span className="pl-3 pr-1 text-[12px] font-mono text-white/40">/community/</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="your-community"
          className="flex-1 bg-transparent outline-none py-2 text-[13px] text-white placeholder:text-white/25 font-mono"
        />
        <div className="pr-3">{iconEl}</div>
      </div>
      {reason && (
        <p className={cn('text-[11.5px]', state === 'available' ? 'text-emerald-300/80' : 'text-red-300/80')}>
          {reason}
        </p>
      )}
      {state === 'available' && !reason && (
        <p className="text-[11.5px] text-emerald-300/80">Available</p>
      )}
    </div>
  )
}