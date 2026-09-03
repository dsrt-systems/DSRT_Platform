'use client'

import { format } from 'date-fns'
import { Calendar, MapPin, Video, Clock, Users } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export function EventHeader({ event, config }: { event: any; config: any }) {
  const cover = event.cover_url || event.banner_url
  const start = new Date(event.starts_at)

  return (
    <header className="rounded-3xl border border-white/[0.06] bg-[#0a0a0f] overflow-hidden">
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-white/[0.05] to-transparent">
        {cover && <img src={cover} alt="" className="w-full h-full object-cover opacity-80" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent" />
      </div>
      <div className="px-5 md:px-8 py-6 -mt-16 relative">
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-white/50">
          <Calendar className="w-3 h-3" strokeWidth={1.75} />
          {format(start, 'EEE · MMM d · h:mm a')} · {event.timezone}
          <span className="opacity-40">·</span>
          <span>{event.event_type?.toLowerCase() || 'general'}</span>
        </div>
        <h1 className="mt-3 text-[26px] md:text-[32px] font-bold text-white tracking-tight leading-tight">
          {event.title}
        </h1>
        {event.tagline && (
          <p className="mt-2 text-[15px] text-white/70 leading-relaxed max-w-2xl">{event.tagline}</p>
        )}
        <div className="mt-4 flex items-center gap-4 flex-wrap text-[12px] text-white/55">
          {event.is_online ? (
            <span className="inline-flex items-center gap-1"><Video className="w-3.5 h-3.5" strokeWidth={1.75} /> Online</span>
          ) : event.location_text ? (
            <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" strokeWidth={1.75} /> {event.location_text}</span>
          ) : null}
          {event.ends_at && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
              Ends {format(new Date(event.ends_at), 'h:mm a')}
            </span>
          )}
          {config?.capacity && (
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
              {formatNumber(config.confirmed_count || 0)} / {formatNumber(config.capacity)}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}