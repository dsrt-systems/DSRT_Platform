'use client'

import Link from 'next/link'
import { PageShell, LoadingState, ErrorState } from '@/components/kernel-ui'
import { EventHeader } from './EventHeader'
import { RegisterPanel } from './RegisterPanel'
import { useEventDetail } from '@/hooks/useCommunityEvents'

interface Props {
  slug: string
}

export function EventPublicPage({ slug }: Props) {
  const { data, loading, error, reload } = useEventDetail(slug)

  if (loading) return <PageShell width="wide"><LoadingState label="Loading event…" /></PageShell>
  if (error || !data) {
    return (
      <PageShell width="wide">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <ErrorState title="Could not load event" errorCode={error || 'UNKNOWN'} onRetry={reload} />
        </div>
      </PageShell>
    )
  }

  const { event, config, my_registration } = data

  return (
    <PageShell width="wide">
      <div className="space-y-6">
        <EventHeader event={event} config={config} />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <article className="space-y-6">
            {event.description && (
              <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="label-mono text-white/50 mb-3">About this event</p>
                <p className="text-[13.5px] text-white/80 whitespace-pre-wrap leading-relaxed">{event.description}</p>
              </section>
            )}

            {event.meeting_url && my_registration?.status === 'CONFIRMED' && (
              <section className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                <p className="label-mono text-white/50 mb-1">Meeting link</p>
                <a href={event.meeting_url} target="_blank" rel="noreferrer" className="text-[13px] text-white hover:underline break-all">
                  {event.meeting_url}
                </a>
              </section>
            )}
          </article>

          <aside className="space-y-4 lg:sticky lg:top-24 self-start">
            <RegisterPanel
              event={event}
              config={config}
              myRegistration={my_registration}
              onChanged={reload}
            />
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="label-mono text-white/50 mb-2">Organized by</p>
              <Link href={`/community/${event.community_id}`} className="text-[13px] text-white hover:underline">
                Community
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  )
}