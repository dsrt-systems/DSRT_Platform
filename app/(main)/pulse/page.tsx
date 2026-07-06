import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { RefreshBriefingButton } from '@/components/pulse/RefreshBriefingButton'
import { AutoRefresh } from '@/components/feed/AutoRefresh'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const CATEGORY_ICONS: Record<string, string> = {
  startups: '🚀',
  technology: '💻',
  'ai-robotics': '🤖',
  finance: '💰',
  biotech: '🧬',
  climate: '🌱',
  space: '🌌',
  aviation: '✈️',
  default: '📰',
}

export default async function PulsePage() {
  const supabase = createClient()

  const { data: posts } = await supabase
    .from('editorial_posts')
    .select('*, editorial_categories(*)')
    .order('published_at', { ascending: false })
    .limit(50)

  const { data: categories } = await supabase
    .from('editorial_categories')
    .select('*')
    .eq('active', true)
    .order('name')

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <AutoRefresh />

      <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 to-transparent backdrop-blur-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                DSRT Editorial · Live
              </p>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Builder Pulse
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Startup funding, company news, and product launches. Auto-updates every 30 minutes.
            </p>
          </div>
          <RefreshBriefingButton />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium whitespace-nowrap">
          All
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            className="px-3 py-1.5 rounded-full border border-border/40 bg-card/40 backdrop-blur-sm text-xs font-medium whitespace-nowrap hover:border-border transition-colors"
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {!posts || posts.length === 0 ? (
          <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-12 text-center space-y-3">
            <div className="text-4xl">📡</div>
            <h3 className="font-semibold">Loading news...</h3>
          </div>
        ) : (
          posts.map((post) => {
            const slug = post.editorial_categories?.slug || 'default'
            const icon = CATEGORY_ICONS[slug] || CATEGORY_ICONS.default

            return (
              <Link
                key={post.id}
                href={`/pulse/${post.id}`}
                className="block rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-5 hover:border-border transition-all group"
              >
                <div className="flex gap-4">
                  <div className="text-4xl opacity-50 flex-shrink-0 hidden sm:block">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: `${post.editorial_categories?.color}20`,
                          color: post.editorial_categories?.color,
                        }}
                      >
                        {post.editorial_categories?.icon} {post.editorial_categories?.name}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}
                      </span>
                    </div>

                    <h2 className="font-bold text-lg leading-tight group-hover:text-foreground">
                      {post.headline}
                    </h2>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.summary}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span>👁 {post.view_count || 0}</span>
                      <span>❤ {post.like_count || 0}</span>
                      <span>💬 {post.comment_count || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}