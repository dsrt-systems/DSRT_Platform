'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Compass, UsersRound } from 'lucide-react'
import {
  PageShell,
  PageHeader,
  EmptyState,
  ErrorState,
  SkeletonRows,
} from '@/components/kernel-ui'
import { cn } from '@/lib/utils'
import { useMyCommunities, type MyCommunityItem } from '@/hooks/useMyCommunities'
import { MyCommunityRow } from './MyCommunityRow'
import { DraftsStrip } from './DraftsStrip'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'OWNER', label: 'Owned' },
  { key: 'ADMIN', label: 'Admin' },
  { key: 'MODERATOR', label: 'Moderator' },
  { key: 'MEMBER', label: 'Member' },
] as const

type Filter = (typeof FILTERS)[number]['key']

export function MyCommunitiesPage() {
  const { items, drafts, loading, error, reload } = useMyCommunities()
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [draftItems, setDraftItems] = useState(drafts)

  // Sync drafts prop into local state properly (no render-time side effects)
  useEffect(() => {
    if (!loading) setDraftItems(drafts)
  }, [drafts, loading])

  const filtered = useMemo(() => {
    let list = items
    if (filter !== 'all') list = list.filter((i) => i.top_role === filter)
    if (q.trim()) {
      const s = q.toLowerCase()
      list = list.filter(
        (i) =>
          i.community.name.toLowerCase().includes(s) ||
          i.community.slug.toLowerCase().includes(s) ||
          (i.community.category || '').toLowerCase().includes(s)
      )
    }
    return list
  }, [items, filter, q])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length }
    for (const it of items) c[it.top_role] = (c[it.top_role] || 0) + 1
    return c
  }, [items])

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Community Hub"
        title="My Communities"
        description="Everything you own, admin, moderate, or belong to."
        breadcrumbs={[
          { label: 'Community Hub', href: '/community' },
          { label: 'My Communities' },
        ]}
        actions={
          <>
            <Link
              href="/community"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-white/70 hover:text-white px-3 py-1.5 text-[12px] font-medium transition-colors"
            >
              <Compass className="w-3.5 h-3.5" strokeWidth={1.75} />
              Discover
            </Link>
            <Link
              href="/studio/community/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-white text-black hover:bg-zinc-100 px-3.5 py-1.5 text-[12px] font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Create community
            </Link>
          </>
        }
      />

      <div className="space-y-8">
        {draftItems.length > 0 && (
          <DraftsStrip
            drafts={draftItems}
            onDiscarded={(id) => {
              setDraftItems((prev) => prev.filter((d) => d.id !== id))
              reload()
            }}
          />
        )}

        <section>
          <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
            <div>
              <p className="label-mono text-white/50">Your communities</p>
              <p className="mt-1 text-[13px] text-white/50">
                {items.length === 0
                  ? 'You are not yet in any community.'
                  : `${items.length} ${items.length === 1 ? 'community' : 'communities'}`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] p-1">
                {FILTERS.map((f) => {
                  const count = counts[f.key] || 0
                  return (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11.5px] font-medium transition-colors',
                        filter === f.key ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                      )}
                    >
                      {f.label}
                      {count > 0 && f.key !== 'all' && (
                        <span
                          className={cn(
                            'text-[10px] font-mono px-1 rounded',
                            filter === f.key
                              ? 'bg-black/10 text-black/70'
                              : 'bg-white/[0.06] text-white/50'
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1">
                <Search className="w-3 h-3 text-white/40" strokeWidth={1.75} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search…"
                  className="bg-transparent outline-none text-[12px] text-white placeholder:text-white/30 w-40"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <SkeletonRows count={4} />
          ) : error ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <ErrorState
                title="Could not load your communities"
                description="Something went wrong. Please retry."
                errorCode={error}
                onRetry={reload}
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <EmptyState
                icon={UsersRound}
                title={
                  items.length === 0
                    ? 'You’re not in any community yet'
                    : 'No communities match your filter'
                }
                description={
                  items.length === 0
                    ? 'Discover communities aligned with your interests, or start your own.'
                    : 'Try clearing your filter or search term.'
                }
                action={
                  items.length === 0 ? (
                    <div className="flex items-center gap-2">
                      <Link
                        href="/community"
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-white/80 hover:text-white px-3.5 py-1.5 text-[12px] font-medium transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5" strokeWidth={1.75} />
                        Explore Discover
                      </Link>
                      <Link
                        href="/studio/community/new"
                        className="inline-flex items-center gap-1.5 rounded-full bg-white text-black hover:bg-zinc-100 px-3.5 py-1.5 text-[12px] font-semibold transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                        Create community
                      </Link>
                    </div>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((item: MyCommunityItem) => (
                <MyCommunityRow key={item.membership_id} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  )
}