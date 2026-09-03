'use client'

import Link from 'next/link'
import { ArrowUpRight, Settings, Megaphone, Users, ShieldCheck, MapPin } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { MyCommunityItem } from '@/hooks/useMyCommunities'

const ROLE_META: Record<string, { label: string; tone: string }> = {
  OWNER: { label: 'Owner', tone: 'border-white/[0.14] bg-white/[0.06] text-white' },
  ADMIN: { label: 'Admin', tone: 'border-white/[0.08] bg-white/[0.04] text-white/85' },
  MODERATOR: { label: 'Moderator', tone: 'border-white/[0.06] bg-white/[0.02] text-white/70' },
  MEMBER: { label: 'Member', tone: 'border-white/[0.04] bg-white/[0.015] text-white/60' },
}

export function MyCommunityRow({ item }: { item: MyCommunityItem }) {
  const c = item.community
  const role = ROLE_META[item.top_role] ?? ROLE_META.MEMBER
  const canManage = item.top_role === 'OWNER' || item.top_role === 'ADMIN'

  return (
    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] hover:border-white/[0.12] transition-colors">
      <div className="flex items-center gap-4 p-4">
        <Link
          href={`/community/${c.slug}`}
          className="flex-shrink-0 w-14 h-14 rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden relative group"
        >
          {c.cover_url ? (
            <img
              src={c.cover_url}
              alt=""
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[13px] font-semibold text-white/60">
              {(c.name || '?').slice(0, 2).toUpperCase()}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Link
              href={`/community/${c.slug}`}
              className="text-[14px] font-semibold text-white truncate hover:underline"
            >
              {c.name}
            </Link>
            {c.is_verified && (
              <ShieldCheck className="w-3.5 h-3.5 text-white/70 flex-shrink-0" strokeWidth={1.75} />
            )}
            <span
              className={cn(
                'ml-1 text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none border',
                role.tone
              )}
            >
              {role.label}
            </span>
          </div>

          {c.short_description && (
            <p className="mt-1 text-[12.5px] text-white/55 line-clamp-1 leading-relaxed">
              {c.short_description}
            </p>
          )}

          <div className="mt-2 flex items-center gap-3 text-[11px] text-white/45">
            <span className="inline-flex items-center gap-1">
              <Users className="w-3 h-3" strokeWidth={1.75} />
              {formatNumber(c.member_count)}
            </span>
            {c.location_text && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" strokeWidth={1.75} />
                <span className="truncate max-w-[140px]">{c.location_text}</span>
              </span>
            )}
            <span className="text-white/35">
              Joined {formatDistanceToNow(new Date(item.joined_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {canManage && (
            <>
              <Link
                href={`/community/${c.slug}/studio`}
                className="rounded-full border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-white/70 hover:text-white px-3 py-1 text-[11px] font-medium transition-colors inline-flex items-center gap-1"
              >
                <Settings className="w-3 h-3" strokeWidth={1.75} />
                Manage
              </Link>
              <Link
                href={`/community/${c.slug}/studio/announcements/new`}
                className="rounded-full border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-white/70 hover:text-white px-3 py-1 text-[11px] font-medium transition-colors inline-flex items-center gap-1"
              >
                <Megaphone className="w-3 h-3" strokeWidth={1.75} />
                Announce
              </Link>
            </>
          )}
          <Link
            href={`/community/${c.slug}`}
            className="w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Open"
          >
            <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </div>
  )
}