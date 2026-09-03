'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageShell, LoadingState, ErrorState, ForbiddenState } from '@/components/kernel-ui'
import { CommunityHeader } from './CommunityHeader'
import { CommunitySubNav } from './CommunitySubNav'
import { CommunityRightRail } from './CommunityRightRail'
import { useCommunityDetail } from '@/hooks/useCommunityDetail'

interface Props {
  slug: string
  activeTab: 'overview' | 'discussion' | 'events' | 'projects' | 'people' | 'about'
  children: React.ReactNode
}

export function CommunityDetailShell({ slug, activeTab, children }: Props) {
  const router = useRouter()
  const { data, loading, error, reload } = useCommunityDetail(slug)

  // Fire-and-forget visit tracker
  useEffect(() => {
    if (!data) return
    fetch(`/api/v1/community/${encodeURIComponent(slug)}/track-visit`, {
      method: 'POST',
      keepalive: true,
    }).catch(() => {})
  }, [data?.community?.id, slug])

  if (loading) {
    return (
      <PageShell width="wide">
        <LoadingState label="Loading community…" />
      </PageShell>
    )
  }

  if (error || !data) {
    return (
      <PageShell width="wide">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <ErrorState
            title="Could not load this community"
            description="It may have been archived or renamed."
            errorCode={error || 'UNKNOWN'}
            onRetry={reload}
          />
        </div>
      </PageShell>
    )
  }

  // Archived visibility
  if (data.community.status === 'ARCHIVED') {
    return (
      <PageShell width="wide">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <ForbiddenState
            title={`${data.community.name} is archived`}
            description="This community is no longer active."
            actionLabel="Explore Discover"
            actionHref="/community"
          />
        </div>
      </PageShell>
    )
  }

  // Private visibility non-member cannot view content
  const c = data.community
  const caps = data.capabilities
  const isVisibleShell = caps.can_view || c.visibility === 'PUBLIC'

  return (
    <PageShell width="wide">
      <div className="space-y-6">
        <CommunityHeader detail={data} onChanged={reload} />

        <CommunitySubNav slug={c.slug} memberCount={c.member_count || 0} />

        {!isVisibleShell ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <ForbiddenState
              title="This community is private"
              description="Join to view its discussion, events, and members."
            />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div>{children}</div>
            <div className="space-y-4 lg:sticky lg:top-24 self-start">
              <CommunityRightRail detail={data} />
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}