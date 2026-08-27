'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { MagnifyingGlass, CaretDown } from '@phosphor-icons/react'
import { useState, useRef, useEffect } from 'react'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interviews', label: 'Interviews' },
  { key: 'offers', label: 'Offers' },
  { key: 'completed', label: 'Completed' },
  { key: 'withdrawn', label: 'Withdrawn' },
  { key: 'drafts', label: 'Drafts' },
]

const SORT_OPTIONS = [
  { key: 'recent_activity', label: 'Recent activity' },
  { key: 'recently_applied', label: 'Recently applied' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'title', label: 'Opportunity name' },
]

export function ApplicantDashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const sp = useSearchParams()
  const filter = sp.get('filter') || 'all'
  const sort = sp.get('sort') || 'recent_activity'
  const search = sp.get('search') || ''

  const [q, setQ] = useState(search)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const p = new URLSearchParams(sp.toString())
      if (q) p.set('search', q); else p.delete('search')
      router.replace(`/looking-for/my-applications?${p.toString()}`, { scroll: false })
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [q])

  const setFilter = (f: string) => {
    const p = new URLSearchParams(sp.toString())
    if (f === 'all') p.delete('filter'); else p.set('filter', f)
    router.replace(`/looking-for/my-applications?${p.toString()}`, { scroll: false })
  }

  const setSort = (s: string) => {
    const p = new URLSearchParams(sp.toString())
    if (s === 'recent_activity') p.delete('sort'); else p.set('sort', s)
    router.replace(`/looking-for/my-applications?${p.toString()}`, { scroll: false })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="text-[24px] md:text-[28px] font-bold text-white tracking-tight">My Applications</h1>
            <p className="text-[13px] text-zinc-500 mt-1">Track every opportunity you've applied to and follow their status.</p>
          </div>
          <Link href="/looking-for" className="inline-flex items-center h-10 px-5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-zinc-200 transition-colors shadow-sm">
            Browse Opportunities
          </Link>
        </div>

        {/* Search + Sort */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-lg">
            <MagnifyingGlass size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search applications..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
            />
          </div>
          <SortDropdown value={sort} onChange={setSort} />
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-zinc-800/80 mb-6">
          <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
            {FILTERS.map(f => {
              const active = filter === f.key
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={
                    'relative py-3 px-4 text-[13px] font-semibold whitespace-nowrap transition-colors ' +
                    (active ? 'text-white' : 'text-zinc-500 hover:text-zinc-200')
                  }
                >
                  {f.label}
                  {active && <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-white" />}
                </button>
              )
            })}
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}

function SortDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [open])

  const current = SORT_OPTIONS.find(o => o.key === value)?.label || 'Recent activity'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-[12.5px] font-medium text-zinc-300 hover:text-white transition-colors"
      >
        {current}
        <CaretDown size={11} weight="bold" className="text-zinc-500" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-zinc-800 bg-[#0c0c0e] shadow-2xl z-30 py-1">
          {SORT_OPTIONS.map(o => (
            <button
              key={o.key}
              onClick={() => { onChange(o.key); setOpen(false) }}
              className={'w-full text-left px-3 py-2 text-[12.5px] transition-colors ' + (value === o.key ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900')}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}