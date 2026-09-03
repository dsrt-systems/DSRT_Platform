'use client'

import Link from 'next/link'
import { CalendarDays, MapPin, Video, Users } from 'lucide-react'
import { SectionHeader, EmptyState, LoadingState } from '@/components/kernel-ui'
import { format } from 'date-fns'
import type { CommunityDetail } from '@/hooks/useCommunityDetail'
import { useCommunityEvents } from '@/hooks/useCommunityDetail'
import { formatNumber } from '@/lib/utils'

export function EventsTab({ detail }: { detail: CommunityDetail }) {
  const { data, loading } = useCommunityEvents(detail.community.slug)

  if (loading) {
    return <LoadingState label="Loading events…" />
  }

  const empty = data.upcoming.length === 0 && data.past.length === 0

  if (empty) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <EmptyState
          icon={CalendarDays}
          title="No events yet"
          description="When this community schedules events, they'll appear here with RSVP + attendance."
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {data.upcoming.length > 0 && (
        <section>
          <SectionHeader title="Upcoming" variant="mono" />
          <div className="grid gap-3 md:grid-cols-2">
            {data.upcoming.map((e: any) => (
              <EventPreviewCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
      {data.past.length > 0 && (
        <section>
          <SectionHeader title="Past" variant="mono" />
          <div className="grid gap-3 md:grid-cols-2">
            {data.past.map((e: any) => (
              <EventPreviewCard key={e.id} event={e} past />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function EventPreviewCard({ event, past }: { event: any; past?: boolean }) {
  const cover = event.cover_image || event.banner_url
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] hover:border-white/[0.12] transition-colors overflow-hidden">
      {cover && (
        <div className="relative h-28 bg-white/[0.02] overflow-hidden">
          <img src={cover} alt="" className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-white/50">
          <span>{format(new Date(event.start_time), 'EEE · MMM d · h:mm a')}</span>
          {past && <span className="opacity-40">·</span>}
          {past && <span>Past</span>}
        </div>
        <h4 className="mt-2 text-[14px] font-semibold text-white leading-tight">
          {event.title}
        </h4>
        {event.description && (
          <p className="mt-1.5 text-[12.5px] text-white/60 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}
        <div className="mt-3 flex items-center gap-3 flex-wrap text-[11px] text-white/50">
          {event.is_online ? (
            <span className="inline-flex items-center gap-1"><Video className="w-3 h-3" strokeWidth={1.75} /> Online</span>
          ) : event.location ? (
            <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" strokeWidth={1.75} /> {event.location}</span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Users className="w-3 h-3" strokeWidth={1.75} />
            {formatNumber(event.attendee_count || 0)}
            {event.max_attendees ? ` / ${formatNumber(event.max_attendees)}` : ''}
          </span>
        </div>
      </div>
    </div>
  )
}