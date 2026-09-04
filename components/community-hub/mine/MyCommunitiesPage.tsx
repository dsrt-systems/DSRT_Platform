'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Compass, UsersRound } from 'lucide-react'
import { ErrorState } from '@/components/kernel-ui'
import { useMyCommunities, type MyCommunityItem } from '@/hooks/useMyCommunities'
import { MyCommunityRow } from './MyCommunityRow'
import { DraftsStrip } from './DraftsStrip'
import { DsrtPage, DsrtSection, DsrtButton, DsrtInput, DsrtTabs, DsrtEmpty, DsrtPanel, DsrtRowSkeleton } from '@/components/dsrt'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'OWNER', label: 'Owned' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MODERATOR', label: 'Moderator' },
  { value: 'MEMBER', label: 'Member' },
]

export function MyCommunitiesPage() {
  const { items, drafts, loading, error, reload } = useMyCommunities()
  const [filter, setFilter] = useState<string>('all')
  const [q, setQ] = useState('')
  const [draftItems, setDraftItems] = useState(drafts)

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

  // Add badges to filters
  const filtersWithBadges = FILTERS.map(f => ({
    ...f,
    badge: f.value !== 'all' && counts[f.value] ? counts[f.value] : undefined,
  }))

  return (
    <DsrtPage width="wide" className="space-y-6 py-6">
      <DsrtSection
        title="My Communities"
        description="Everything you own, admin, moderate, or belong to across DSRT."
        headerVariant="large"
        actions={
          <div className="flex items-center gap-2">
            <DsrtButton asChild variant="outline" size="sm">
              <Link href="/community">
                <Compass className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Discover</span>
              </Link>
            </DsrtButton>
            <DsrtButton asChild variant="white" size="sm">
              <Link href="/studio/community/new">
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Create Community</span>
                <span className="sm:hidden">Create</span>
              </Link>
            </DsrtButton>
          </div>
        }
      />

      <div className="space-y-6 sm:space-y-8">
        {draftItems.length > 0 && (
          <DraftsStrip
            drafts={draftItems}
            onDiscarded={(id) => {
              setDraftItems((prev) => prev.filter((d) => d.id !== id))
              reload()
            }}
          />
        )}

        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-white/50">Your communities</p>
              <p className="mt-1 text-[13px] text-white/50">
                {items.length === 0
                  ? 'You are not yet in any community.'
                  : `${items.length} ${items.length === 1 ? 'community' : 'communities'}`}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <DsrtTabs
                variant="segmented"
                tabs={filtersWithBadges}
                activeValue={filter}
                onValueChange={setFilter}
                className="w-full sm:w-auto overflow-x-auto"
              />
              <div className="w-full sm:w-48">
                <DsrtInput
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search..."
                  icon={<Search size={13} />}
                  sizeVariant="sm"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <DsrtRowSkeleton count={4} />
          ) : error ? (
            <DsrtPanel>
              <ErrorState
                title="Could not load your communities"
                description="Something went wrong. Please retry."
                errorCode={error}
                onRetry={reload}
              />
            </DsrtPanel>
          ) : filtered.length === 0 ? (
            <DsrtPanel>
              <DsrtEmpty
                icon={UsersRound}
                title={items.length === 0 ? 'You\'re not in any community yet' : 'No communities match your filter'}
                description={items.length === 0 ? 'Discover communities aligned with your interests, or start your own.' : 'Try clearing your filter or search term.'}
                action={
                  items.length === 0 ? (
                    <div className="flex items-center gap-2">
                      <DsrtButton asChild variant="outline" size="sm">
                        <Link href="/community">
                          <Compass size={14} /> Explore Discover
                        </Link>
                      </DsrtButton>
                      <DsrtButton asChild variant="white" size="sm">
                        <Link href="/studio/community/new">
                          <Plus size={14} /> Create Community
                        </Link>
                      </DsrtButton>
                    </div>
                  ) : undefined
                }
              />
            </DsrtPanel>
          ) : (
            <div className="space-y-2">
              {filtered.map((item: MyCommunityItem) => (
                <MyCommunityRow key={item.membership_id} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </DsrtPage>
  )
}