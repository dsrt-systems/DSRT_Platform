'use client'

import Link from 'next/link'
import { CalendarDays, Megaphone, Users, MessagesSquare } from 'lucide-react'
import { SectionHeader, EmptyState, LoadingState } from '@/components/kernel-ui'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import type { CommunityDetail } from '@/hooks/useCommunityDetail'
import { useCommunityOverview } from '@/hooks/useCommunityDetail'

export function OverviewTab({ detail }: { detail: CommunityDetail }) {
  const { data, loading } = useCommunityOverview(detail.community.slug)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Upcoming event */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <SectionHeader title="Upcoming event" variant="mono" />
        {loading ? (
          <LoadingState variant="compact" label="Loading…" />
        ) : !data?.upcoming_event ? (
          <EmptyState
            variant="compact"
            icon={CalendarDays}
            title="No upcoming events"
            description="Check back later, or explore other communities."
          />
        ) : (
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl border border-white/[0.06] bg-white/[0.04] flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-[9.5px] font-mono uppercase tracking-wider text-white/50 leading-none">
                {format(new Date(data.upcoming_event.start_time), 'MMM')}
              </span>
              <span className="text-[18px] font-bold text-white leading-none mt-0.5">
                {format(new Date(data.upcoming_event.start_time), 'd')}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-white truncate">
                {data.upcoming_event.title}
              </p>
              <p className="mt-0.5 text-[11.5px] font-mono uppercase tracking-wider text-white/45">
                {format(new Date(data.upcoming_event.start_time), 'EEE · h:mm a')}
                {data.upcoming_event.location && ` · ${data.upcoming_event.location}`}
                {data.upcoming_event.is_online && ' · Online'}
              </p>
              {data.upcoming_event.description && (
                <p className="mt-2 text-[12.5px] text-white/60 line-clamp-2 leading-relaxed">
                  {data.upcoming_event.description}
                </p>
              )}
              <Link
                href={`/community/${detail.community.slug}/events`}
                className="mt-3 inline-flex items-center text-[11.5px] font-medium text-white/60 hover:text-white transition-colors"
              >
                All events →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Latest announcement */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <SectionHeader title="Latest announcement" variant="mono" />
        {loading ? (
          <LoadingState variant="compact" label="Loading…" />
        ) : !data?.latest_announcement ? (
          <EmptyState
            variant="compact"
            icon={Megaphone}
            title="No announcements yet"
            description="Admins will share community updates here."
          />
        ) : (
          <div>
            <p className="text-[12.5px] text-white/70 leading-relaxed line-clamp-4">
              {data.latest_announcement.content}
            </p>
            <p className="mt-2 text-[10.5px] font-mono uppercase tracking-wider text-white/40">
              {format(new Date(data.latest_announcement.created_at), 'MMM d, yyyy · h:mm a')}
            </p>
          </div>
        )}
      </section>

      {/* Recent members */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 lg:col-span-2">
        <SectionHeader
          title="Recent members"
          variant="mono"
          actions={
            <Link
              href={`/community/${detail.community.slug}/people`}
              className="text-[11px] font-medium text-white/60 hover:text-white transition-colors"
            >
              See all →
            </Link>
          }
        />
        {loading ? (
          <LoadingState variant="compact" label="Loading…" />
        ) : (data?.recent_members?.length || 0) === 0 ? (
          <EmptyState variant="compact" icon={Users} title="No members yet" />
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            {data!.recent_members.map((u: any) => (
              <Link
                key={u.id}
                href={`/profile/${u.username}`}
                className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors px-2 py-1"
              >
                <Avatar className="w-6 h-6 border border-white/[0.06]">
                  <AvatarImage src={u.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[9px] bg-white/[0.06] text-white/80">
                    {(u.full_name || '?').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[11.5px] text-white/80 truncate max-w-[120px]">
                  {u.full_name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent posts placeholder — Phase 10 handles full content */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 lg:col-span-2">
        <SectionHeader title="Recent discussion" variant="mono" />
        <EmptyState
          variant="compact"
          icon={MessagesSquare}
          title="Discussion is coming"
          description="Posts, announcements, and polls arrive with the content system."
        />
      </section>
    </div>
  )
}