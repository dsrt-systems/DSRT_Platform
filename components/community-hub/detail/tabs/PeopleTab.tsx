'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, Users, ShieldCheck, Crown, Shield, Gavel, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { EmptyState, ErrorState, LoadingState, SkeletonCards, SectionHeader, ForbiddenState } from '@/components/kernel-ui'
import { useCommunityMembers } from '@/hooks/useCommunityDetail'
import type { CommunityDetail } from '@/hooks/useCommunityDetail'

const FILTERS = [
  { key: null as string | null, label: 'All' },
  { key: 'OWNER', label: 'Owners' },
  { key: 'ADMIN', label: 'Admins' },
  { key: 'MODERATOR', label: 'Moderators' },
  { key: 'MEMBER', label: 'Members' },
]

const ROLE_ICON: Record<string, any> = {
  OWNER: Crown,
  ADMIN: Shield,
  MODERATOR: Gavel,
  MEMBER: User,
}

export function PeopleTab({ detail }: { detail: CommunityDetail }) {
  const c = detail.community
  const caps = detail.capabilities
  const showDirectory = detail.settings?.show_member_directory !== false || caps.is_member || caps.is_admin

  const [role, setRole] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const { items, loading, loadingMore, hasMore, error, reload, loadMore } = useCommunityMembers(c.slug, role, q)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMore) loadMore()
    }, { rootMargin: '400px' })
    io.observe(sentinelRef.current)
    return () => io.disconnect()
  }, [hasMore, loading, loadingMore, loadMore])

  if (!showDirectory) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <ForbiddenState
          title="Member directory hidden"
          description="This community keeps its member list private. Join to see who's in."
        />
      </div>
    )
  }

  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
        <SectionHeader title="People" variant="mono" />
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] p-1">
            {FILTERS.map((f) => (
              <button
                key={String(f.key)}
                onClick={() => setRole(f.key)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11.5px] font-medium transition-colors',
                  role === f.key ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                )}
              >
                {f.label}
              </button>
            ))}
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
        <SkeletonCards count={6} />
      ) : error ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <ErrorState errorCode={error} onRetry={reload} />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <EmptyState icon={Users} title="No matches" description="Try a different filter or search." />
        </div>
      ) : (
        <>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it: any) => (
              <MemberRow key={it.membership_id} row={it} />
            ))}
          </div>
          {hasMore && (
            <div ref={sentinelRef} className="pt-6">
              {loadingMore && <LoadingState variant="compact" label="Loading more…" />}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function MemberRow({ row }: { row: any }) {
  const u = row.user
  if (!u) return null
  const Icon = ROLE_ICON[row.top_role] || User
  return (
    <Link
      href={`/profile/${u.username}`}
      className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] hover:border-white/[0.12] p-3 transition-colors"
    >
      <Avatar className="w-11 h-11 border border-white/[0.08]">
        <AvatarImage src={u.avatar_url ?? undefined} />
        <AvatarFallback className="text-[12px] bg-white/[0.06] text-white/80 font-semibold">
          {(u.full_name || '?').charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-white truncate group-hover:underline flex items-center gap-1">
          {u.full_name}
          {u.is_verified && <ShieldCheck className="w-3 h-3 text-white/60" strokeWidth={1.75} />}
        </p>
        <p className="text-[11px] text-white/45 truncate flex items-center gap-1">
          <Icon className="w-3 h-3" strokeWidth={1.75} />
          <span className="uppercase tracking-wider font-mono">{row.top_role.toLowerCase()}</span>
          {u.tagline && (
            <>
              <span className="opacity-40">·</span>
              <span className="truncate">{u.tagline}</span>
            </>
          )}
        </p>
      </div>
    </Link>
  )
}