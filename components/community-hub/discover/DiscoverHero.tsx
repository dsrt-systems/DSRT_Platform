'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { DiscoverCommunityCard } from '@/hooks/useCommunityDiscover'

export function DiscoverHero() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<DiscoverCommunityCard[]>([])
  const [loading, setLoading] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const q = query.trim()
    if (!q || q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/v1/community/discover/search?q=${encodeURIComponent(q)}&limit=6`,
          { signal: ctrl.signal }
        )
        const json = await res.json()
        setResults(json?.data?.items || [])
      } catch {
        // ignore aborts
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [query])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <section
      className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#0e0e14] via-[#0a0a10] to-[#080810] p-8 md:p-10 relative overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-white/[0.03] blur-[120px]" />
      </div>

      <div className="relative max-w-2xl mx-auto text-center space-y-6">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/40 mb-3">
            Community Hub · Discover
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Find your people on DSRT
          </h1>
          <p className="mt-3 text-[13.5px] text-white/55 max-w-lg mx-auto leading-relaxed">
            Explore communities aligned with your skills, interests, and location.
            Join to collaborate, learn, and ship together.
          </p>
        </div>

        <div ref={rootRef} className="relative">
          <div
            className={cn(
              'flex items-center gap-2 rounded-full border transition-colors',
              open
                ? 'border-white/[0.16] bg-white/[0.04]'
                : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12]'
            )}
          >
            <div className="pl-4 pr-1 text-white/40">
              <Search className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              placeholder="Search communities…"
              className="flex-1 bg-transparent outline-none text-[13.5px] text-white placeholder:text-white/35 py-3"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="mr-2 w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {open && query.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-white/[0.08] bg-[#0c0c12] shadow-2xl overflow-hidden z-30">
              {loading ? (
                <div className="flex items-center gap-2 px-4 py-4 text-[12.5px] text-white/50">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Searching…
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-4 text-[12.5px] text-white/50 text-center">
                  No communities match "{query}"
                </div>
              ) : (
                <div className="max-h-[380px] overflow-y-auto scrollbar-hide">
                  {results.map((r) => (
                    <Link
                      key={r.id}
                      href={`/community/${r.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-[11px] font-semibold text-white/70 flex-shrink-0">
                        {(r.name || '?').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-[13px] text-white truncate">{r.name}</p>
                        <p className="text-[11px] text-white/45 truncate">
                          {r.member_count} members · {r.category || 'general'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}