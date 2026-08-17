'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, Briefcase, Files, Eye, BookmarkSimple, Users, Warning,
} from '@phosphor-icons/react'
import { OpportunityRow } from '../manage/OpportunityRow'

interface Props {
  onCreate: () => void
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'paused', label: 'Paused' },
  { key: 'closed', label: 'Closed' },
]

export function MyOpportunitiesTab({ onCreate }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState('all')
  const [items, setItems] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('filter', filter)
      const res = await fetch('/api/opportunities/my-opportunities?' + params.toString())
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setItems(data.opportunities || [])
      setStats(data.stats || null)
    } catch (e: any) {
      setError(e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 rounded-xl border border-zinc-800 bg-zinc-950/40 animate-pulse" />
          ))}
        </div>
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-24 rounded-xl border border-zinc-800 bg-zinc-950/40 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
        <Warning size={20} className="mx-auto mb-2 text-red-400" />
        <p className="text-[13px] text-red-400">{error}</p>
      </div>
    )
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center">
          <Briefcase size={20} className="text-zinc-500" />
        </div>
        <h2 className="text-[16px] font-bold text-white mb-1.5">No opportunities yet</h2>
        <p className="text-[12.5px] text-zinc-500 mb-5 max-w-md mx-auto leading-relaxed">
          Create your first opportunity to start finding collaborators, hires, mentors, or co-founders.
        </p>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-white text-black hover:bg-zinc-100 text-[13px] font-bold shadow-[0_2px_12px_rgba(255,255,255,0.15)]"
        >
          <Plus size={12} weight="bold" />
          Create your first opportunity
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Active" value={stats.active} Icon={Briefcase} />
        <StatCard label="Applications" value={stats.total_applications} Icon={Users} accent />
        <StatCard label="Views" value={stats.total_views} Icon={Eye} />
        <StatCard label="Saves" value={stats.total_saves} Icon={BookmarkSimple} />
        <StatCard label="Drafts" value={stats.drafts} Icon={Files} />
      </div>

      {/* Filter + New button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 border border-zinc-800 rounded-md p-0.5 bg-zinc-950">
          {FILTERS.map(f => {
            const count = f.key === 'all' ? stats.total : (stats[f.key] || 0)
            const isActive = filter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={
                  'inline-flex items-center gap-1.5 h-8 px-3 rounded text-[12px] font-semibold transition-colors ' +
                  (isActive
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-white')
                }
              >
                {f.label}
                <span className={
                  'text-[10.5px] font-bold ' +
                  (isActive ? 'text-zinc-400' : 'text-zinc-600')
                }>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <button
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-zinc-800 hover:border-zinc-700 text-[12.5px] font-medium text-zinc-300 hover:text-white transition-colors"
        >
          <Plus size={11} weight="bold" />
          New opportunity
        </button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
          <p className="text-[13px] text-zinc-500">No {filter} opportunities</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map(opp => (
            <OpportunityRow
              key={opp.id}
              opportunity={opp}
              onManage={() => router.push(`/looking-for/my-opportunities/${opp.id}`)}
              onView={() => router.push(`/looking-for/${opp.slug}`)}
              onRefresh={load}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, Icon, accent }: { label: string; value: number; Icon: any; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500">
          {label}
        </span>
        <Icon size={11} weight="regular" className="text-zinc-600" />
      </div>
      <div className={
        'text-[22px] font-bold tracking-tight ' +
        (accent ? 'text-blue-400' : 'text-white')
      }>
        {value.toLocaleString()}
      </div>
    </div>
  )
}