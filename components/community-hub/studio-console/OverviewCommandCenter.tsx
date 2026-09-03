'use client'

import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import {
  UserCheck,
  Mail,
  Users,
  TrendingUp,
  CalendarDays,
  ArrowUpRight,
  Activity,
} from 'lucide-react'
import { SectionHeader, LoadingState, ErrorState, EmptyState } from '@/components/kernel-ui'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatNumber } from '@/lib/utils'
import { useStudioOverview } from '@/hooks/useCommunityStudio'

interface Props {
  slug: string
}

export function OverviewCommandCenter({ slug }: Props) {
  const { data, loading, error, reload } = useStudioOverview(slug)

  if (loading) return <LoadingState label="Loading Studio overview…" />
  if (error) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <ErrorState errorCode={error} onRetry={reload} />
      </div>
    )
  }

  const counts = data?.counts || {}
  const base = `/community/${slug}/studio`

  const tiles = [
    { key: 'apps', label: 'Pending applications', value: counts.pending_applications ?? 0, icon: UserCheck, href: `${base}/applications`, highlight: (counts.pending_applications ?? 0) > 0 },
    { key: 'inv', label: 'Pending invitations', value: counts.pending_invitations ?? 0, icon: Mail, href: `${base}/invitations`, highlight: (counts.pending_invitations ?? 0) > 0 },
    { key: 'mem', label: 'Active members', value: counts.active_members ?? 0, icon: Users, href: `${base}/members` },
    { key: 'new', label: 'New this week', value: counts.new_members_7d ?? 0, icon: TrendingUp, href: `${base}/members` },
  ]

  return (
    <div className="space-y-10">
      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={
              'group rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] hover:from-white/[0.05] hover:border-white/[0.14] transition-colors p-4 ' +
              (t.highlight ? 'border-white/[0.14]' : '')
            }
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.04] flex items-center justify-center">
                <t.icon className="w-4 h-4 text-white/70" strokeWidth={1.75} />
              </div>
              {t.highlight && (
                <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/[0.08] text-white/70">
                  Needs attention
                </span>
              )}
            </div>
            <p className="text-[24px] font-semibold text-white leading-none numeric">
              {formatNumber(t.value)}
            </p>
            <p className="mt-1.5 text-[11.5px] font-mono uppercase tracking-wider text-white/45">
              {t.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Pending applications preview */}
      <section>
        <SectionHeader
          title="Applications awaiting review"
          variant="mono"
          actions={
            <Link
              href={`${base}/applications`}
              className="text-[11px] font-medium text-white/60 hover:text-white transition-colors"
            >
              Manage →
            </Link>
          }
        />
        {(data?.pending_applications_preview?.length || 0) === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <EmptyState variant="compact" icon={UserCheck} title="No pending applications" />
          </div>
        ) : (
          <div className="space-y-2">
            {data.pending_applications_preview.map((a: any) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <Avatar className="w-9 h-9 border border-white/[0.06]">
                  <AvatarImage src={a.applicant?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[11px] bg-white/[0.06] text-white/80">
                    {(a.applicant?.full_name || '?').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white truncate">
                    {a.applicant?.full_name || 'Anonymous applicant'}
                  </p>
                  <p className="text-[11px] text-white/45">
                    Applied {formatDistanceToNow(new Date(a.submitted_at), { addSuffix: true })}
                  </p>
                </div>
                <Link
                  href={`${base}/applications`}
                  className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-white/80 hover:text-white px-3 py-1 text-[11px] font-medium transition-colors"
                >
                  Review
                  <ArrowUpRight className="w-3 h-3" strokeWidth={1.75} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming events */}
      <section>
        <SectionHeader title="Upcoming events" variant="mono" />
        {(data?.upcoming_events?.length || 0) === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <EmptyState variant="compact" icon={CalendarDays} title="No upcoming events scheduled" />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {data.upcoming_events.map((e: any) => (
              <div
                key={e.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <p className="text-[10.5px] font-mono uppercase tracking-wider text-white/40">
                  {format(new Date(e.start_time), 'EEE · MMM d · h:mm a')}
                </p>
                <p className="mt-2 text-[13.5px] font-semibold text-white line-clamp-1">
                  {e.title}
                </p>
                <p className="mt-2 text-[11px] text-white/45">
                  {e.attendee_count || 0} registered
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent activity */}
      <section>
        <SectionHeader title="Recent activity" variant="mono" />
        {(data?.recent_activity?.length || 0) === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <EmptyState variant="compact" icon={Activity} title="No activity yet" />
          </div>
        ) : (
          <ul className="space-y-2">
            {data.recent_activity.map((a: any) => (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3"
              >
                <div className="w-9 h-9 rounded-full border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-white/70">
                  <Activity className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] text-white/80 truncate">
                    <span className="font-medium text-white">
                      {a.actor?.full_name || 'System'}
                    </span>{' '}
                    <span className="text-white/50">{a.verb.replace(/^community\./, '').replace(/\./g, ' ')}</span>
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-mono uppercase tracking-wider text-white/40">
                    {formatDistanceToNow(new Date(a.occurred_at), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}