'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { CalendarClock, MapPin, Video, Users } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'

interface Props {
  event: any
  communitySlug: string
}

export function EventCard({ event, communitySlug }: Props) {
  const schedule = (event.event_schedules || []).find((s: any) => s.is_primary) || (event.event_schedules || [])[0]
  const location = (event.event_locations || []).find((l: any) => l.is_primary) || (event.event_locations || [])[0]
  const config = event.event_registration_config || {}
  const starts = schedule?.starts_at ? new Date(schedule.starts_at) : null
  const remaining = config?.capacity != null ? Math.max(0, config.capacity - (config.confirmed_count || 0)) : null

  return (
    <Link
      href={`/community/${communitySlug}/events/${event.slug}`}
      className="group block rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] hover:border-white/[0.14] transition-colors overflow-hidden"
    >
      {event.cover_url && (
        <div className="relative h-32 md:h-40 overflow-hidden">
          <img src={event.cover_url} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
        </div>
      )}
      <div className="p-4 space-y-3">
        {starts && (
          <div className="inline-flex items-center gap-1.5 text-[10.5px] font-mono uppercase tracking-wider text-white/60">
            <CalendarClock className="w-3 h-3" strokeWidth={1.75} />
            {format(starts, 'EEE, MMM d · h:mm a')}
          </div>
        )}
        <h3 className="text-[15px] font-semibold text-white leading-tight">{event.title}</h3>
        {event.tagline && (
          <p className="text-[12.5px] text-white/55 leading-relaxed line-clamp-2">{event.tagline}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/50">
          {event.is_online && location?.meeting_url && (
            <span className="inline-flex items-center gap-1"><Video className="w-3 h-3" strokeWidth={1.75} /> Online</span>
          )}
          {location?.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" strokeWidth={1.75} /> {location.city}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users className="w-3 h-3" strokeWidth={1.75} />
            {formatNumber(config.confirmed_count || 0)}
            {config.capacity ? ` / ${formatNumber(config.capacity)}` : ''}
          </span>
        </div>
        {remaining != null && remaining <= 5 && remaining > 0 && (
          <p className="text-[11px] text-amber-300/85">{remaining} seat{remaining === 1 ? '' : 's'} left</p>
        )}
      </div>
    </Link>
  )
}