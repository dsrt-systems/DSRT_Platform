'use client'

import Link from 'next/link'
import { ShieldCheck, Users, MapPin, Globe, Settings } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { CommunityHeaderActions } from './CommunityHeaderActions'
import type { CommunityDetail } from '@/hooks/useCommunityDetail'

interface Props {
  detail: CommunityDetail
  onChanged?: () => void
}

const POLICY_LABEL: Record<string, string> = {
  OPEN: 'Open to join',
  APPROVAL_REQUIRED: 'Approval required',
  INVITE_ONLY: 'Invite only',
  CLOSED: 'Closed',
}

const VISIBILITY_LABEL: Record<string, string> = {
  PUBLIC: 'Public',
  PRIVATE: 'Private',
  UNLISTED: 'Unlisted',
}

export function CommunityHeader({ detail, onChanged }: Props) {
  const c = detail.community
  const caps = detail.capabilities
  const cover = c.banner_url || c.cover_url

  return (
    <header className="rounded-3xl border border-white/[0.06] bg-[#0a0a0f] overflow-hidden">
      <div className="relative h-40 md:h-56 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent">
        {cover && (
          <img src={cover} alt="" className="w-full h-full object-cover opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent" />
      </div>

      <div className="px-5 md:px-8 pb-6 -mt-14 md:-mt-16 relative">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div className="flex items-end gap-4 md:gap-5 min-w-0">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border border-white/[0.08] bg-[#0f0f14] overflow-hidden flex items-center justify-center flex-shrink-0 shadow-2xl">
              {c.cover_url ? (
                <img src={c.cover_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[22px] font-bold text-white/70">
                  {(c.name || '?').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[22px] md:text-[26px] font-bold text-white tracking-tight leading-tight">
                  {c.name}
                </h1>
                {c.is_verified && (
                  <ShieldCheck className="w-4 h-4 text-white/70" strokeWidth={1.75} />
                )}
                {c.community_type && (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/60 leading-none">
                    {c.community_type.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px] font-mono uppercase tracking-wider text-white/50">
                <span>{c.category || 'general'}</span>
                <span className="opacity-40">·</span>
                <span>{VISIBILITY_LABEL[c.visibility] || 'Public'}</span>
                <span className="opacity-40">·</span>
                <span>{POLICY_LABEL[c.join_policy] || 'Open'}</span>
              </div>

              {c.short_description && (
                <p className="mt-3 text-[13.5px] text-white/70 leading-relaxed max-w-2xl">
                  {c.short_description}
                </p>
              )}

              <div className="mt-3 flex items-center gap-4 text-[11.5px] text-white/50 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3 h-3" strokeWidth={1.75} />
                  {formatNumber(c.member_count)} members
                </span>
                {c.location_text && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" strokeWidth={1.75} />
                    <span className="truncate max-w-[220px]">{c.location_text}</span>
                  </span>
                )}
                {c.website && (
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Globe className="w-3 h-3" strokeWidth={1.75} />
                    <span className="truncate max-w-[220px]">
                      {c.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {caps.can_manage_settings && (
              <Link
                href={`/community/${c.slug}/studio`}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-white/80 hover:text-white px-3 py-2 text-[12px] font-medium transition-colors"
              >
                <Settings className="w-3.5 h-3.5" strokeWidth={1.75} />
                Manage
              </Link>
            )}
            <CommunityHeaderActions
              communityId={c.id}
              slug={c.slug}
              name={c.name}
              joinPolicy={c.join_policy}
              membershipStatus={caps.membership_status}
              isMember={caps.is_member}
              isOwner={caps.is_owner}
              onChanged={onChanged}
            />
          </div>
        </div>
      </div>
    </header>
  )
}