'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FileText, ChatCircle, Handshake, WarningCircle, CheckCircle } from '@phosphor-icons/react'
import { ApplicationList } from './ApplicationList'

export function ApplicantOverview() {
  const sp = useSearchParams()
  const filter = sp.get('filter') || 'all'
  const search = sp.get('search') || ''
  const sort = sp.get('sort') || 'recent_activity'

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const load = async (cursor?: string) => {
    if (cursor) setLoadingMore(true); else setLoading(true)
    try {
      const p = new URLSearchParams()
      if (filter !== 'all') p.set('filter', filter)
      if (search) p.set('search', search)
      if (sort !== 'recent_activity') p.set('sort', sort)
      if (cursor) p.set('cursor', cursor)

      const res = await fetch(`/api/opportunities/my-applications?${p.toString()}`)
      const d = await res.json()

      if (mountedRef.current) {
        if (cursor && data) {
          setData({
            ...d,
            applications: [...data.applications, ...(d.applications || [])],
          })
        } else {
          setData(d)
        }
      }
    } catch {}
    finally {
      if (mountedRef.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }

  useEffect(() => { load() }, [filter, search, sort])

  // Window focus refetch
  useEffect(() => {
    const handler = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [filter, search, sort])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-zinc-900/40 animate-pulse border border-zinc-800/80" />)}
        </div>
        <div className="space-y-2">
          {[0,1,2].map(i => <div key={i} className="h-20 rounded-2xl bg-zinc-900/40 animate-pulse border border-zinc-800/80" />)}
        </div>
      </div>
    )
  }

  if (!data) return <div className="text-red-400">Failed to load dashboard.</div>

  const stats = data.stats || {}
  const apps = data.applications || []
  const attentionItems = apps.filter((a: any) => a.unread_messages > 0 || a.pipeline_stage === 'offer' || a.pipeline_stage === 'interview')

  return (
    <div className="space-y-8">
      {filter === 'all' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Active" value={stats.active} icon={FileText} />
          <StatCard label="Shortlisted" value={stats.shortlisted} icon={CheckCircle} accent="cyan" />
          <StatCard label="Interviews" value={stats.interviews} icon={ChatCircle} accent="purple" />
          <StatCard label="Offers" value={stats.offers} icon={Handshake} accent="amber" />
        </div>
      )}

      {filter === 'all' && attentionItems.length > 0 && (
        <div className="rounded-2xl border border-blue-500/25 bg-gradient-to-b from-blue-500/10 to-[#0f0f11] overflow-hidden">
          <div className="px-5 py-3 border-b border-blue-500/20 bg-blue-500/5">
            <h3 className="text-[12.5px] font-bold text-blue-300 flex items-center gap-2">
              <WarningCircle size={16} weight="fill" /> Action Required
            </h3>
          </div>
          <div className="divide-y divide-zinc-800/60 p-2">
            {attentionItems.map((a: any) => (
              <a key={a.id} href={`/looking-for/my-applications/${a.id}`} className="flex items-center justify-between p-3 hover:bg-zinc-900/40 rounded-xl transition-colors group">
                <div>
                  <div className="text-[13px] font-semibold text-white group-hover:text-blue-300">{a.opportunity?.title}</div>
                  <div className="text-[11.5px] text-zinc-400 mt-0.5">
                    {a.unread_messages > 0 ? `${a.unread_messages} unread message(s)` : `Stage: ${a.pipeline_stage}`}
                  </div>
                </div>
                <div className="text-[11.5px] font-bold text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 group-hover:bg-zinc-800">View →</div>
              </a>
            ))}
          </div>
        </div>
      )}

      <ApplicationList
        applications={apps}
        filter={filter}
        hasMore={!!data.has_more}
        loadingMore={loadingMore}
        onLoadMore={() => data.next_cursor && load(data.next_cursor)}
      />
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent }: any) {
  const c = accent === 'cyan' ? 'text-cyan-400' : accent === 'purple' ? 'text-purple-400' : accent === 'amber' ? 'text-amber-400' : 'text-white'
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0f0f11] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</span>
        <Icon size={14} className="text-zinc-600" />
      </div>
      <div className={`text-[26px] font-bold tracking-tight ${c}`}>{value || 0}</div>
    </div>
  )
}