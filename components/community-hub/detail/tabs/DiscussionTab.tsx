'use client'

import { DiscussionFeed } from '@/components/community-hub/content/DiscussionFeed'
import type { CommunityDetail } from '@/hooks/useCommunityDetail'

export function DiscussionTab({ detail }: { detail: CommunityDetail }) {
  return <DiscussionFeed detail={detail} />
}