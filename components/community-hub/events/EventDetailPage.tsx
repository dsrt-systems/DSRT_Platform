'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { CalendarClock, MapPin, Video, Users, ArrowLeft, Settings } from 'lucide-react'
import { PageShell, LoadingState, ErrorState } from '@/components/kernel-ui'
import { useEvent } from '@/hooks/useEvents'
import { EventRegistrationButton } from './EventRegistrationButton'
import { formatNumber } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface Props {
  eventId: string
  communitySlug: string
  canManage?: boolean
}

export function EventDetailPage({ eventId, communitySlug, canManage }: Props) {
  const { data, loading, reload } = useEvent(eventId)
  const [myRegistration, setMyRegistration] = useState<any>(null)

  useEffect(() => {
    if (!eventId) return
    fetch(`/api/v1/events/${eventId}/registrations`)
      .then((r) => r.json())
      .then((j) => {
        // For self-view — we filter client-side by using the currently authed user's row
        // (RLS returns only own registration for members)
        const list = j?.data?.items || []
        setMyRegistration(list[0] || null)
      })
      .catch(() => setMyRegistration(null))
  }, [eventId])

  if (loading) return <PageShell><LoadingState label="Loading event…" /></PageShell>
  if (!data) return <PageShell><ErrorState /></PageShell>

  const { event, schedules, locations, config } = data
  const schedule = schedules.find((s: any) => s.is_primary) || schedules[0]
  const location = locations.find((l: any) => l.is_primary) || locations[0]
  const starts = schedule?.starts_at ? new Date(schedule.starts_at) : null
  const ends = schedule?.ends_at ? new Date(schedule.ends_at) : null

  return (
    <PageShell width="wide">
      <Link
        href={`/community/${communitySlug}/events`}
        className="inline-flex items-center gap-1.5 text-[12px] text-white/60 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
        Back to events
      </Link>

      <article className="rounded-3xl border border-white/[0.06] bg-[#0a0a0f] overflow-hidden">
        {event.cover_url && (
          <div className="relative h-48 md:h-72 overflow-hidden">
            <img src={event.cover_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
          </div>
        )}
        <div className="p-6 md:p-10">
          {starts && (
            <p className="text-[11.5px] font-mono uppercase tracking-wider text-white/60 mb-3">
              <CalendarClock className="w-3.5 h-3.5 inline mr-1.5" strokeWidth={1.75} />
              {format(starts, 'EEEE · MMMM d, yyyy · h:mm a')}
              {ends && ` — ${format(ends, 'h:mm a')}`}
            </p>
          )}
          <h1 className="text-[24px] md:text-[30px] font-bold text-white tracking-tight leading-tight">{event.title}</h1>
          {event.tagline && (
            <p className="mt-2 text-[14px] text-white/70 leading-relaxed max-w-2xl">{event.tagline}</p>
          )}

          <div className="mt-4 flex items-center gap-4 text-[12.5px] text-white/55 flex-wrap">
            {event.is_online && location?.meeting_url && (
              <span className="inline-flex items-center gap-1"><Video className="w-3.5 h-3.5" strokeWidth={1.75} /> Online</span>
            )}
            {location?.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" strokeWidth={1.75} />
                {[location.name, location.city, location.country].filter(Boolean).join(', ')}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
              {formatNumber(config?.confirmed_count || 0)}
              {config?.capacity ? ` / ${formatNumber(config.capacity)}` : ' registered'}
            </span>
          </div>

          <div className="mt-6 flex items-center gap-2 flex-wrap">
            <EventRegistrationButton event={event} config={config} myRegistration={myRegistration} onChanged={reload} />
            {canManage && (
              <Link
                href={`/community/${communitySlug}/events/${event.slug}/manage`}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-white/80 hover:text-white px-3 py-2 text-[12px] font-medium transition-colors"
              >
                <Settings className="w-3.5 h-3.5" strokeWidth={1.75} />
                Manage
              </Link>
            )}
          </div>

          {event.description && (
            <div className="mt-8 prose prose-invert max-w-none">
              <p className="text-[14px] text-white/80 whitespace-pre-wrap leading-relaxed">{event.description}</p>
            </div>
          )}
        </div>
      </article>
    </PageShell>
  )
}