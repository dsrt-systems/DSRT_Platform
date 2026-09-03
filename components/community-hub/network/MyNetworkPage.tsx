'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Compass, RefreshCw } from 'lucide-react'
import { PageShell, PageHeader } from '@/components/kernel-ui'
import { NetworkSummaryStrip } from './NetworkSummaryStrip'
import { CommunitiesBucket } from './CommunitiesBucket'
import { PeopleFromCommunities } from './PeopleFromCommunities'
import { NetworkActivityFeed } from './NetworkActivityFeed'
import { useNetworkSummary } from '@/hooks/useCommunityNetwork'
import { cn } from '@/lib/utils'

export function MyNetworkPage() {
  const { summary, loading, reload } = useNetworkSummary()
  const [activeBucket, setActiveBucket] = useState<'joined' | 'following' | 'invited' | 'past'>('joined')

  const scrollToId = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleNavigate = (bucket: 'joined' | 'following' | 'invited' | 'people') => {
    if (bucket === 'people') {
      scrollToId('people')
      return
    }
    setActiveBucket(bucket)
    setTimeout(() => scrollToId('communities-bucket'), 30)
  }

  const onInvitationResolved = () => {
    reload()
  }

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Community Hub"
        title="My Network"
        description="Your community graph — communities you're in, following, invited to, and the people you've met through them."
        breadcrumbs={[
          { label: 'Community Hub', href: '/community' },
          { label: 'My Network' },
        ]}
        actions={
          <>
            <button
              onClick={reload}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02]',
                'text-white/70 hover:text-white hover:bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium transition-colors'
              )}
            >
              <RefreshCw className="w-3 h-3" strokeWidth={1.75} />
              Refresh
            </button>
            <Link
              href="/community"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full bg-white text-black hover:bg-zinc-100',
                'px-3.5 py-1.5 text-[12px] font-semibold transition-colors'
              )}
            >
              <Compass className="w-3.5 h-3.5" strokeWidth={1.75} />
              Discover more
            </Link>
          </>
        }
      />

      <div className="space-y-10">
        <NetworkSummaryStrip
          summary={summary}
          loading={loading}
          onNavigate={handleNavigate}
        />

        <div id="communities-bucket">
          <CommunitiesBucket
            initial={activeBucket}
            onInvitationResolved={onInvitationResolved}
          />
        </div>

        <PeopleFromCommunities />

        <NetworkActivityFeed />
      </div>
    </PageShell>
  )
}