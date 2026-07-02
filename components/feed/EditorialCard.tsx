'use client'

import Link from 'next/link'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface EditorialCardProps {
  post: any
}

export function EditorialCard({ post }: EditorialCardProps) {
  return (
    <article className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card/40 to-card/40 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground font-bold text-xs">D</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="font-semibold text-sm">DSRT Editorial</p>
            <CheckCircle2 className="w-3 h-3 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.published_at), {
              addSuffix: true,
            })}
            {post.source_name && ` · via ${post.source_name}`}
          </p>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{
            backgroundColor: `${post.editorial_categories?.color}20`,
            color: post.editorial_categories?.color,
          }}
        >
          {post.editorial_categories?.icon} {post.editorial_categories?.name}
        </span>
      </div>

      {/* Cover image */}
      {post.cover_image_url && (
        <Link href={`/pulse/${post.id}`} className="block">
          <div className="aspect-[2/1] bg-muted overflow-hidden">
            <img
              src={post.cover_image_url}
              alt=""
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        </Link>
      )}

      {/* Content */}
      <Link href={`/pulse/${post.id}`} className="block p-4 space-y-2 group">
        <h2 className="font-bold text-base leading-tight group-hover:text-foreground">
          {post.headline}
        </h2>
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {post.summary}
        </p>
      </Link>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center gap-4 text-xs text-muted-foreground border-t border-border/40 pt-3">
        <span>👁 {post.view_count || 0}</span>
        <span>❤ {post.like_count || 0}</span>
        <span>💬 {post.comment_count || 0}</span>
        <Link
          href={`/pulse/${post.id}`}
          className="ml-auto text-primary hover:underline font-medium"
        >
          Read article →
        </Link>
      </div>
    </article>
  )
}