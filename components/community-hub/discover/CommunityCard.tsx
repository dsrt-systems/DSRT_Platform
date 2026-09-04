'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Users, MapPin, ShieldCheck } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'
import { JoinPill } from './JoinPill'
import { FollowPill } from './FollowPill'
import { CommunityCardMenu } from './CommunityCardMenu'
import { trackDiscoverEvents } from '@/hooks/useCommunityDiscover'
import type { DiscoverCommunityCard } from '@/hooks/useCommunityDiscover'
import { DsrtPanel, DsrtChip } from '@/components/dsrt'

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

  // Horizontal / compact
  if (variant === 'horizontal' || variant === 'compact') {
    return (
      <div ref={rootRef} className="group relative flex-shrink-0 w-[260px] sm:w-[280px]">
        <DsrtPanel
          padding="none"
          variant="default"
          className="overflow-hidden hover:border-white/[0.12] transition-colors h-full"
        >
          <Link href={`/community/${community.slug}`} onClick={handleClick} className="block">
            <div className="relative h-24 bg-gradient-to-br from-[#0f172a] to-[#0a0a0f] overflow-hidden">
              {cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt=""
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#05070D] via-transparent to-transparent" />
            </div>
            <div className="p-3 space-y-2">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white truncate flex items-center gap-1">
                  {community.name}
                  {community.is_verified && (
                    <ShieldCheck className="w-3 h-3 text-[#93c5fd] flex-shrink-0" strokeWidth={1.75} />
                  )}
                </p>
                <p className="text-[10px] text-white/40 truncate mt-0.5 font-mono uppercase tracking-wider">
                  {community.category || 'general'} · {formatNumber(community.member_count)} members
                </p>
              </div>
              {community.short_description && (
                <p className="text-[12px] text-white/60 line-clamp-2 leading-snug">
                  {community.short_description}
                </p>
              )}
            </div>
          </Link>
          <div className="px-3 pb-3 flex items-center justify-between gap-2">
            <JoinPill community={community} surface={surface} compact />
            <div className="flex items-center gap-1.5">
              <FollowPill community={community} surface={surface} />
              <CommunityCardMenu community={community} onDismiss={onDismiss} />
            </div>
          </div>
        </DsrtPanel>
      </div>
    )
  }

  // Grid
  return (
    <div ref={rootRef} className="group relative h-full">
      <DsrtPanel
        padding="none"
        variant="default"
        className="overflow-hidden hover:border-white/[0.12] transition-colors h-full flex flex-col"
      >
        <Link href={`/community/${community.slug}`} onClick={handleClick} className="block flex-1">
          <div className="relative h-28 bg-gradient-to-br from-[#0f172a] to-[#0a0a0f] overflow-hidden">
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt=""
                className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#05070D] via-[#05070D]/20 to-transparent" />
          </div>

          <div className="p-4 space-y-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[14px] font-semibold text-white truncate">{community.name}</p>
                {community.is_verified && (
                  <ShieldCheck
                    className="w-3.5 h-3.5 text-[#93c5fd] flex-shrink-0"
                    strokeWidth={1.75}
                  />
                )}
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/40 mt-1">
                {community.category || 'general'}
                {community.location_text && (
                  <>
                    <span className="mx-1.5 opacity-40">·</span>
                    <span>{community.location_text}</span>
                  </>
                )}
              </p>
            </div>

            {community.short_description && (
              <p className="text-[12.5px] text-white/60 line-clamp-2 leading-relaxed">
                {community.short_description}
              </p>
            )}

            {community.reason_text && (
              <DsrtChip size="sm" tone="accent" className="max-w-full">
                <span className="truncate">{community.reason_text}</span>
              </DsrtChip>
            )}

            <div className="flex items-center gap-3 text-[11px] text-white/45 pt-0.5">
              <span className="inline-flex items-center gap-1">
                <Users className="w-3 h-3" strokeWidth={1.75} />
                {formatNumber(community.member_count)}
              </span>
              {community.location_text && (
                <span className="inline-flex items-center gap-1 min-w-0">
                  <MapPin className="w-3 h-3 shrink-0" strokeWidth={1.75} />
                  <span className="truncate max-w-[100px]">{community.location_text}</span>
                </span>
              )}
            </div>
          </div>
        </Link>

        <div className="px-4 pb-4 flex items-center justify-between gap-2 border-t border-white/[0.04] pt-3 mt-auto">
          <JoinPill community={community} surface={surface} />
          <div className="flex items-center gap-1.5">
            <FollowPill community={community} surface={surface} />
            <CommunityCardMenu community={community} onDismiss={onDismiss} />
          </div>
        </div>
      </DsrtPanel>
    </div>
  )
}