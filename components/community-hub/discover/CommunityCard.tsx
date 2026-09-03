'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Users, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'
import { JoinPill } from './JoinPill'
import { FollowPill } from './FollowPill'
import { CommunityCardMenu } from './CommunityCardMenu'
import { trackDiscoverEvents } from '@/hooks/useCommunityDiscover'
import type { DiscoverCommunityCard } from '@/hooks/useCommunityDiscover'

interface CommunityCardProps {
  community: DiscoverCommunityCard
  surface: string
  variant?: 'grid' | 'horizontal' | 'compact'
  onDismiss?: (id: string) => void
}

export function CommunityCard({
  community,
  surface,
  variant = 'grid',
  onDismiss,
}: CommunityCardProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  // Impression tracking
  useEffect(() => {
    if (!rootRef.current) return
    let sent = false
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !sent) {
            sent = true
            trackDiscoverEvents([
              { community_id: community.id, event_type: 'IMPRESSION', surface },
            ])
            io.disconnect()
          }
        })
      },
      { threshold: 0.5 }
    )
    io.observe(rootRef.current)
    return () => io.disconnect()
  }, [community.id, surface])

  const handleClick = () => {
    trackDiscoverEvents([
      { community_id: community.id, event_type: 'CLICK', surface },
    ])
  }

  const cover = community.cover_url || community.banner_url

  // ---------------- HORIZONTAL / COMPACT VARIANT ----------------
  if (variant === 'horizontal' || variant === 'compact') {
    return (
      <div
        ref={rootRef}
        className="group relative flex-shrink-0 w-[280px] rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] overflow-hidden hover:border-white/[0.12] transition-colors"
      >
        <Link href={`/community/${community.slug}`} onClick={handleClick} className="block">
          <div className="relative h-24 bg-gradient-to-br from-white/[0.06] to-white/[0.02] overflow-hidden">
            {cover && (
              <img
                src={cover}
                alt=""
                className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          </div>
          <div className="p-3 space-y-2">
            <div className="flex items-start gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white truncate flex items-center gap-1">
                  {community.name}
                  {community.is_verified && (
                    <ShieldCheck className="w-3 h-3 text-white/70 flex-shrink-0" strokeWidth={1.75} />
                  )}
                </p>
                <p className="text-[11px] text-white/40 truncate mt-0.5 font-mono uppercase tracking-wider">
                  {community.category || 'general'} · {formatNumber(community.member_count)} members
                </p>
              </div>
            </div>
            {community.short_description && (
              <p className="text-[12px] text-white/60 line-clamp-2 leading-snug">
                {community.short_description}
              </p>
            )}
          </div>
        </Link>
        <div className="px-3 pb-3 flex items-center justify-between">
          <JoinPill community={community} surface={surface} compact />
          <div className="flex items-center gap-1.5">
            <FollowPill community={community} surface={surface} />
            <CommunityCardMenu community={community} onDismiss={onDismiss} />
          </div>
        </div>
      </div>
    )
  }

  // ---------------- GRID VARIANT (default) ----------------
  return (
    <div
      ref={rootRef}
      className="group relative rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] overflow-hidden hover:border-white/[0.12] transition-colors"
    >
      <Link href={`/community/${community.slug}`} onClick={handleClick} className="block">
        <div className="relative h-28 bg-gradient-to-br from-white/[0.06] to-white/[0.02] overflow-hidden">
          {cover && (
            <img
              src={cover}
              alt=""
              className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[14px] font-semibold text-white truncate">
                  {community.name}
                </p>
                {community.is_verified && (
                  <ShieldCheck
                    className="w-3.5 h-3.5 text-white/70 flex-shrink-0"
                    strokeWidth={1.75}
                  />
                )}
              </div>
              <p className="text-[10.5px] font-mono uppercase tracking-wider text-white/40 mt-1">
                {community.category || 'general'}
                {community.location_text && (
                  <>
                    <span className="mx-1.5 opacity-40">·</span>
                    <span>{community.location_text}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {community.short_description && (
            <p className="text-[12.5px] text-white/60 line-clamp-2 leading-relaxed">
              {community.short_description}
            </p>
          )}

          {community.reason_text && (
            <div className="flex items-center gap-1.5 text-[11px] text-white/50">
              <Sparkles className="w-3 h-3 text-white/50" strokeWidth={1.75} />
              <span className="truncate">{community.reason_text}</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-[11px] text-white/45 pt-1">
            <span className="inline-flex items-center gap-1">
              <Users className="w-3 h-3" strokeWidth={1.75} />
              {formatNumber(community.member_count)}
            </span>
            {community.location_text && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" strokeWidth={1.75} />
                <span className="truncate max-w-[100px]">{community.location_text}</span>
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4 flex items-center justify-between border-t border-white/[0.04] pt-3">
        <JoinPill community={community} surface={surface} />
        <div className="flex items-center gap-1.5">
          <FollowPill community={community} surface={surface} />
          <CommunityCardMenu community={community} onDismiss={onDismiss} />
        </div>
      </div>
    </div>
  )
}