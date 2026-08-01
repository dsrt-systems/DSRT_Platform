'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface EditorialCardProps {
  post: any
}

const CATEGORY_STYLES: Record<string, { icon: string; accent: string; label: string }> = {
  'dsrt-research': { icon: '⚗', accent: 'border-l-purple-500', label: 'RESEARCH' },
  'dsrt-builders': { icon: '⚡', accent: 'border-l-amber-500', label: 'BUILDER UPDATE' },
  'dsrt-intel': { icon: '◈', accent: 'border-l-emerald-500', label: 'INTEL' },
  default: { icon: '◉', accent: 'border-l-primary', label: 'EDITORIAL' },
}

export function EditorialCard({ post }: EditorialCardProps) {
  const slug = post.editorial_categories?.slug || 'default'
  const style = CATEGORY_STYLES[slug] || CATEGORY_STYLES.default

  return (
    <article className={`skeu-card overflow-hidden border-l-4 ${style.accent}`}>
      {/* Header */}
      <div className="p-3 pb-2 flex items-center gap-2.5">
        {/* Gold DSRT badge */}
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center border border-amber-300/50 shadow-md">
            <span className="text-white font-bold text-xs drop-shadow">D</span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
            <svg viewBox="0 0 24 24" className="w-2 h-2 text-primary-foreground" fill="currentColor">
              <path d="M9.5 16.5L4 11l1.4-1.4L9.5 13.7l9.1-9.1L20 6l-10.5 10.5z" />
            </svg>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm">DSRT Editorial</p>
            <span className="text-[8px] font-bold text-amber-600 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 px-1.5 py-0.5 rounded font-mono tracking-wider">
              DSRT
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            <span className="numeric">
              {formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}
            </span>
            {post.source_name && ` · ${post.source_name}`}
          </p>
        </div>

        <div className="chip">
          <span>{style.icon}</span>
          <span>{style.label}</span>
        </div>
      </div>

      {/* Content */}
      <Link href={`/pulse/${post.id}`} className="block px-3 pb-3 group">
        <h2 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors mb-1.5">
          {post.headline}
        </h2>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {post.summary}
        </p>
      </Link>

      {/* Footer */}
      <div className="flex items-center px-3 py-2 border-t border-border bg-muted/20 gap-3">
        <MetricPill icon="👁" value={post.view_count || 0} />
        <MetricPill icon="♥" value={post.like_count || 0} />
        <MetricPill icon="💬" value={post.comment_count || 0} />
        <div className="flex-1" />
        <Link
          href={`/pulse/${post.id}`}
          className="text-[11px] font-mono uppercase tracking-wider text-primary hover:underline"
        >
          Read →
        </Link>
      </div>
    </article>
  )
}

function MetricPill({ icon, value }: { icon: string; value: number }) {
  return (
    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <span>{icon}</span>
      <span className="numeric">{value}</span>
    </div>
  )
}
