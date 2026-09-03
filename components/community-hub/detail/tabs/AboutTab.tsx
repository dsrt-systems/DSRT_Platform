'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Globe, MapPin, Calendar, ShieldCheck, Users } from 'lucide-react'
import { SectionHeader } from '@/components/kernel-ui'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatNumber } from '@/lib/utils'
import type { CommunityDetail } from '@/hooks/useCommunityDetail'

export function AboutTab({ detail }: { detail: CommunityDetail }) {
  const c = detail.community

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <SectionHeader title="About" variant="mono" />
          {c.description ? (
            <p className="text-[13.5px] text-white/75 leading-relaxed whitespace-pre-wrap">
              {c.description}
            </p>
          ) : (
            <p className="text-[13px] text-white/50">No description yet.</p>
          )}
        </section>

        {c.mission && (
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <SectionHeader title="Mission" variant="mono" />
            <p className="text-[13.5px] text-white/75 leading-relaxed whitespace-pre-wrap">
              {c.mission}
            </p>
          </section>
        )}

        {detail.rules && detail.rules.length > 0 && (
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <SectionHeader title="Community rules" variant="mono" />
            <ol className="space-y-3">
              {detail.rules.map((r, i) => (
                <li key={r.id} className="flex items-start gap-3">
                  <span className="text-[10.5px] font-mono text-white/40 pt-1">{String(i + 1).padStart(2, '0')}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-white">{r.title}</p>
                    {r.description && (
                      <p className="mt-1 text-[12.5px] text-white/60 leading-relaxed">
                        {r.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <aside className="space-y-6">
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <SectionHeader title="Details" variant="mono" />
          <dl className="space-y-3 text-[12.5px]">
            <Detail label="Category">{c.category || 'general'}</Detail>
            <Detail label="Type">{(c.community_type || '').replace(/_/g, ' ') || '—'}</Detail>
            <Detail label="Visibility">{c.visibility}</Detail>
            <Detail label="Join policy">{c.join_policy.replace(/_/g, ' ')}</Detail>
            <Detail label="Members">
              <span className="inline-flex items-center gap-1 text-white/80">
                <Users className="w-3 h-3" strokeWidth={1.75} />
                {formatNumber(c.member_count)}
              </span>
            </Detail>
            {c.location_text && (
              <Detail label="Location">
                <span className="inline-flex items-center gap-1 text-white/80">
                  <MapPin className="w-3 h-3" strokeWidth={1.75} />
                  {c.location_text}
                </span>
              </Detail>
            )}
            {c.website && (
              <Detail label="Website">
                <a href={c.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-white/80 hover:text-white">
                  <Globe className="w-3 h-3" strokeWidth={1.75} />
                  {c.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              </Detail>
            )}
            {c.founded_at && (
              <Detail label="Founded">
                <span className="inline-flex items-center gap-1 text-white/80">
                  <Calendar className="w-3 h-3" strokeWidth={1.75} />
                  {format(new Date(c.founded_at), 'MMMM yyyy')}
                </span>
              </Detail>
            )}
            <Detail label="Created">{format(new Date(c.created_at), 'MMM d, yyyy')}</Detail>
          </dl>
        </section>

        {detail.admins.length > 0 && (
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <SectionHeader title="Team" variant="mono" />
            <div className="space-y-3">
              {detail.admins.map((a) => (
                <Link
                  key={a.identity_id}
                  href={`/profile/${a.user.username}`}
                  className="flex items-center gap-3 group"
                >
                  <Avatar className="w-9 h-9 border border-white/[0.06]">
                    <AvatarImage src={a.user.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[11px] bg-white/[0.06] text-white/80">
                      {(a.user.full_name || '?').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-white truncate group-hover:underline flex items-center gap-1">
                      {a.user.full_name}
                      {a.user.is_verified && <ShieldCheck className="w-3 h-3 text-white/60" strokeWidth={1.75} />}
                    </p>
                    <p className="text-[10.5px] font-mono uppercase tracking-wider text-white/40 truncate">
                      {a.role_key.toLowerCase()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </aside>
    </div>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.04] pb-2 last:border-none last:pb-0">
      <dt className="text-[10.5px] font-mono uppercase tracking-wider text-white/40">{label}</dt>
      <dd className="text-[12.5px] text-white/80 truncate max-w-[220px] text-right">{children}</dd>
    </div>
  )
}