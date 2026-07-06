'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface EditorialCardProps {
  post: any
}

const CATEGORY_ACCENTS: Record<string, { bg: string; border: string; icon: string }> = {
  startups: { bg: 'from-orange-500/10 to-transparent', border: 'border-l-orange-500', icon: '🚀' },
  technology: { bg: 'from-blue-500/10 to-transparent', border: 'border-l-blue-500', icon: '💻' },
  'ai-robotics': { bg: 'from-purple-500/10 to-transparent', border: 'border-l-purple-500', icon: '🤖' },
  finance: { bg: 'from-emerald-500/10 to-transparent', border: 'border-l-emerald-500', icon: '💰' },
  biotech: { bg: 'from-rose-500/10 to-transparent', border: 'border-l-rose-500', icon: '🧬' },
  climate: { bg: 'from-green-500/10 to-transparent', border: 'border-l-green-500', icon: '🌱' },
  space: { bg: 'from-indigo-500/10 to-transparent', border: 'border-l-indigo-500', icon: '🌌' },
  aviation: { bg: 'from-sky-500/10 to-transparent', border: 'border-l-sky-500', icon: '✈️' },
  default: { bg: 'from-slate-500/10 to-transparent', border: 'border-l-slate-500', icon: '📰' },
}

export function EditorialCard({ post }: EditorialCardProps) {
  const slug = post.editorial_categories?.slug || 'default'
  const accent = CATEGORY_ACCENTS[slug] || CATEGORY_ACCENTS.default

  return (
    <article
      className={`rounded-2xl border border-border/40 border-l-4 ${accent.border} bg-gradient-to-r ${accent.bg} backdrop-blur-sm overflow-hidden hover:border-border/60 transition-all`}
    >
      {/* Header */}
      <div className="p-5 pb-3 flex items-center gap-3">
        {/* Gold DSRT Logo */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center border-2 border-amber-300/50 shadow-lg shadow-amber-500/20">
            <span className="text-white font-bold text-sm tracking-tight drop-shadow">
              D
            </span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center border-2 border-background">
            <svg
              viewBox="0 0 24 24"
              className="w-3 h-3 text-primary-foreground"
              fill="currentColor"
            >
              <path d="M9.5 16.5L4 11l1.4-1.4L9.5 13.7l9.1-9.1L20 6l-10.5 10.5z" />
            </svg>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm">DSRT Editorial</p>
            <span className="text-[9px] font-bold text-amber-600 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
              DSRT
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}
            {post.source_name && ` · ${post.source_name}`}
          </p>
        </div>

        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap"
          style={{
            backgroundColor: `${post.editorial_categories?.color || '#666'}20`,
            color: post.editorial_categories?.color || '#666',
          }}
        >
          {post.editorial_categories?.icon} {post.editorial_categories?.name}
        </span>
      </div>

      {/* Content with category icon as accent */}
      <Link href={`/pulse/${post.id}`} className="block px-5 pb-4 group">
        <div className="flex gap-4">
          {/* Category emoji as decorative accent */}
          <div className="flex-shrink-0 hidden sm:block">
            <div className="text-4xl opacity-40 group-hover:opacity-70 transition-opacity">
              {accent.icon}
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <h2 className="font-bold text-lg leading-tight group-hover:text-foreground">
              {post.headline}
            </h2>
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {post.summary}
            </p>
          </div>
        </div>
      </Link>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center gap-4 text-xs text-muted-foreground border-t border-border/40 pt-3">
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