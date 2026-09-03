'use client'

import Link from 'next/link'
import { RailCard } from '@/components/kernel-ui'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ExternalLink, Globe, MapPin, Users, ShieldCheck, Crown, Shield } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import type { CommunityDetail } from '@/hooks/useCommunityDetail'
import { useSimilarCommunities } from '@/hooks/useCommunityDetail'

export function CommunityRightRail({ detail }: { detail: CommunityDetail }) {
  const c = detail.community
  const similar = useSimilarCommunities(c.slug)

  return (
    <>
      <RailCard title="About">
        <p className="text-[12.5px] text-white/70 leading-relaxed whitespace-pre-wrap">
          {c.description || c.short_description || 'No description yet.'}
        </p>
        <div className="mt-3 space-y-1.5 text-[11.5px] text-white/50">
          <div className="inline-flex items-center gap-1.5">
            <Users className="w-3 h-3" strokeWidth={1.75} />
            {formatNumber(c.member_count)} members
          </div>
          {c.location_text && (
            <div className="inline-flex items-center gap-1.5">
              <MapPin className="w-3 h-3" strokeWidth={1.75} />
              <span className="truncate">{c.location_text}</span>
            </div>
          )}
          {c.website && (
            <div className="inline-flex items-center gap-1.5">
              <Globe className="w-3 h-3" strokeWidth={1.75} />
              <a href={c.website} target="_blank" rel="noreferrer" className="hover:text-white truncate">
                {c.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            </div>
          )}
        </div>
      </RailCard>

      {detail.rules && detail.rules.length > 0 && (
        <RailCard title="Rules">
          <ol className="space-y-1.5">
            {detail.rules.map((r, i) => (
              <li key={r.id} className="text-[12.5px] text-white/70 leading-relaxed">
                <span className="text-white/40 font-mono mr-2">{i + 1}.</span>
                {r.title}
                {r.description && (
                  <p className="mt-0.5 text-[11.5px] text-white/50">{r.description}</p>
                )}
              </li>
            ))}
          </ol>
        </RailCard>
      )}

      {detail.admins && detail.admins.length > 0 && (
        <RailCard title="Admins">
          <div className="space-y-2">
            {detail.admins.map((a) => {
              const Icon = a.role_key === 'OWNER' ? Crown : Shield
              return (
                <Link
                  key={a.identity_id}
                  href={`/profile/${a.user.username}`}
                  className="flex items-center gap-2 group"
                >
                  <Avatar className="w-8 h-8 border border-white/[0.06]">
                    <AvatarImage src={a.user.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[11px] bg-white/[0.06] text-white/80">
                      {(a.user.full_name || '?').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] text-white truncate group-hover:underline flex items-center gap-1">
                      {a.user.full_name}
                      {a.user.is_verified && <ShieldCheck className="w-3 h-3 text-white/60" strokeWidth={1.75} />}
                    </p>
                    <p className="text-[10.5px] font-mono uppercase tracking-wider text-white/40 truncate">
                      <Icon className="w-2.5 h-2.5 inline mr-1" strokeWidth={1.75} />
                      {a.role_key.toLowerCase()}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </RailCard>
      )}

      {similar.items.length > 0 && (
        <RailCard
          title="Similar communities"
          actions={
            <Link
              href="/community"
              className="text-[10.5px] font-mono uppercase tracking-wider text-white/40 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              More <ExternalLink className="w-2.5 h-2.5" strokeWidth={1.75} />
            </Link>
          }
        >
          <div className="space-y-2">
            {similar.items.map((s: any) => (
              <Link
                key={s.id}
                href={`/community/${s.slug}`}
                className="flex items-center gap-2.5 group py-1"
              >
                <div className="w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-[10px] font-semibold text-white/70 flex-shrink-0 overflow-hidden">
                  {s.cover_url ? (
                    <img src={s.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (s.name || '?').slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] text-white truncate group-hover:underline flex items-center gap-1">
                    {s.name}
                    {s.is_verified && <ShieldCheck className="w-3 h-3 text-white/60" strokeWidth={1.75} />}
                  </p>
                  <p className="text-[10.5px] font-mono uppercase tracking-wider text-white/40 truncate">
                    {formatNumber(s.member_count)} members · {s.category || 'general'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </RailCard>
      )}
    </>
  )
}