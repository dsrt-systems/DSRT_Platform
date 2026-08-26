'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus, MagnifyingGlass, CalendarBlank } from '@phosphor-icons/react'

const RANGES = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'ytd', label: 'This year' },
]

export function MyOppsHeader() {
  const router = useRouter()
  const [range, setRange] = useState('30d')
  const [rangeOpen, setRangeOpen] = useState(false)
  const [q, setQ] = useState('')

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <h1 className="text-[24px] md:text-[28px] font-bold text-white tracking-tight leading-tight">
          My Opportunities
        </h1>
        <p className="text-[13px] text-zinc-500 mt-1">
          Manage your opportunities, applications, and collaborations.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlass size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && q.trim()) {
                router.push(`/looking-for/my-opportunities/portfolio?q=${encodeURIComponent(q.trim())}`)
              }
            }}
            placeholder="Search your opportunities…"
            className="h-10 pl-9 pr-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 w-[240px]"
          />
        </div>

        {/* Date range */}
        <div className="relative">
          <button
            onClick={() => setRangeOpen(!rangeOpen)}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-[12.5px] font-medium text-zinc-300 hover:text-white"
          >
            <CalendarBlank size={12} />
            {RANGES.find(r => r.key === range)?.label}
          </button>
          {rangeOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-zinc-800 bg-[#0c0c0e] shadow-2xl z-30 py-1">
              {RANGES.map(r => (
                <button
                  key={r.key}
                  onClick={() => { setRange(r.key); setRangeOpen(false); window.dispatchEvent(new CustomEvent('myopps:range', { detail: r.key })) }}
                  className={
                    'w-full text-left px-3 py-2 text-[12.5px] transition-colors ' +
                    (range === r.key ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900')
                  }
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => router.push('/looking-for/create')}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white text-black hover:bg-zinc-100 text-[13px] font-bold shadow-[0_2px_12px_rgba(255,255,255,0.1)]"
        >
          <Plus size={12} weight="bold" />
          Create Opportunity
        </button>
      </div>
    </div>
  )
}