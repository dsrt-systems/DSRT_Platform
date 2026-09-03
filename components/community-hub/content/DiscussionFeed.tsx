'use client'

import { useEffect, useRef } from 'react'
import { MessagesSquare } from 'lucide-react'
import { LoadingState, EmptyState, ErrorState, ForbiddenState, SkeletonRows } from '@/components/kernel-ui'
import { PostComposer } from './PostComposer'
import { AnnouncementComposer } from './AnnouncementComposer'
import { AnnouncementBanner } from './AnnouncementBanner'
import { PostCard } from './PostCard'
import { useCommunityFeed } from '@/hooks/useCommunityFeed'
import type { CommunityDetail } from '@/hooks/useCommunityDetail'
import { useUser } from '@/hooks/useUser'

interface Props {
  detail: CommunityDetail
}

export function DiscussionFeed({ detail }: Props) {
  const { user } = useUser()
  const caps = detail.capabilities
  const c = detail.community

  if (!caps.can_view) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <ForbiddenState
          title="Members only"
          description="Join this community to view its discussion."
        />
      </div>
    )
  }

  return <DiscussionFeedContent detail={detail} currentUser={user} />
}

function DiscussionFeedContent({ detail, currentUser }: { detail: CommunityDetail; currentUser: any }) {
  const c = detail.community
  const caps = detail.capabilities
  const {
    items, pinned, announcements, loading, loadingMore, hasMore, error,
    reload, loadMore, removePost,
  } = useCommunityFeed(c.slug, c.id)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore()
    }, { rootMargin: '400px' })
    io.observe(sentinelRef.current)
    return () => io.disconnect()
  }, [hasMore, loading, loadMore])

  return (
    <div className="space-y-4">
      {caps.can_post && (
        <PostComposer
          communityId={c.id}
          slug={c.slug}
          currentUser={currentUser}
          onPosted={reload}
        />
      )}
      {caps.is_admin && (
        <AnnouncementComposer communityId={c.id} onPosted={reload} />
      )}

      {loading ? (
        <SkeletonRows count={4} />
      ) : error ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <ErrorState errorCode={error} onRetry={reload} />
        </div>
      ) : (
        <>
          {announcements.map((a: any) => (
            <AnnouncementBanner key={a.id} announcement={a} />
          ))}

          {pinned.map((p: any) => (
            <PostCard
              key={p.id}
              post={p}
              slug={c.slug}
              canModerate={caps.is_admin || caps.is_moderator}
              canPost={caps.can_post}
              onDeleted={removePost}
            />
          ))}

          {items.length === 0 && announcements.length === 0 && pinned.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <EmptyState
                icon={MessagesSquare}
                title="No posts yet"
                description={caps.can_post ? 'Be the first to share something.' : 'Join to start the conversation.'}
              />
            </div>
          ) : (
            items.map((p: any) => (
              <PostCard
                key={p.id}
                post={p}
                slug={c.slug}
                canModerate={caps.is_admin || caps.is_moderator}
                canPost={caps.can_post}
                onDeleted={removePost}
              />
            ))
          )}

          {hasMore && (
            <div ref={sentinelRef} className="pt-4">
              {loadingMore && <LoadingState variant="compact" label="Loading more…" />}
            </div>
          )}
        </>
      )}
    </div>
  )
}