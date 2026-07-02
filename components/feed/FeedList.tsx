'use client'

import { PostCard } from './PostCard'
import { EditorialCard } from './EditorialCard'

interface FeedListProps {
  items: any[]
  currentUser: any
}

export function FeedList({ items, currentUser }: FeedListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-12 text-center space-y-3">
        <div className="text-4xl">🚀</div>
        <h3 className="font-semibold">Your feed is just getting started</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Share your first post or follow communities to see what is being built.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) =>
        item.kind === 'editorial' ? (
          <EditorialCard key={`ed-${item.data.id}`} post={item.data} />
        ) : (
          <PostCard
            key={`post-${item.data.id}`}
            post={item.data}
            currentUser={currentUser}
          />
        )
      )}
    </div>
  )
}