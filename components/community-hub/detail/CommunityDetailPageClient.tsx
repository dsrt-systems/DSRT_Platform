'use client'

import { CommunityDetailShell } from './CommunityDetailShell'
import { OverviewTab } from './tabs/OverviewTab'
import { DiscussionTab } from './tabs/DiscussionTab'
import { EventsTab } from './tabs/EventsTab'
import { ProjectsTab } from './tabs/ProjectsTab'
import { PeopleTab } from './tabs/PeopleTab'
import { AboutTab } from './tabs/AboutTab'
import { useCommunityDetail } from '@/hooks/useCommunityDetail'
import { LoadingState } from '@/components/kernel-ui'

interface Props {
  slug: string
  tab: 'overview' | 'discussion' | 'events' | 'projects' | 'people' | 'about'
}

export function CommunityDetailPageClient({ slug, tab }: Props) {
  return (
    <CommunityDetailShell slug={slug} activeTab={tab}>
      <TabRouter slug={slug} tab={tab} />
    </CommunityDetailShell>
  )
}

function TabRouter({ slug, tab }: Props) {
  const { data, loading } = useCommunityDetail(slug)
  if (loading || !data) return <LoadingState variant="compact" label="Loading…" />

  switch (tab) {
    case 'overview': return <OverviewTab detail={data} />
    case 'discussion': return <DiscussionTab detail={data} />
    case 'events': return <EventsTab detail={data} />
    case 'projects': return <ProjectsTab detail={data} />
    case 'people': return <PeopleTab detail={data} />
    case 'about': return <AboutTab detail={data} />
  }
}