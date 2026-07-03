import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { RefreshBriefingButton } from '@/components/pulse/RefreshBriefingButton'
import { AutoRefresh } from '@/components/feed/AutoRefresh'

export const revalidate = 0
export const dynamic = 'force-dynamic'

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
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              First batch is being generated. Check back in 30 seconds.
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`/pulse/${post.id}`}
              className="block rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden hover:border-border transition-all group"
            >
              <div className="grid md:grid-cols-[200px_1fr] gap-0">
                {post.cover_image_url && (
                  <div className="h-40 md:h-full bg-muted overflow-hidden">
                    <img
                      src={post.cover_image_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}

                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: `${post.editorial_categories?.color}20`,
                        color: post.editorial_categories?.color,
                      }}
                    >
                      {post.editorial_categories?.icon}{' '}
                      {post.editorial_categories?.name}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(post.published_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  <h2 className="font-bold text-lg leading-tight group-hover:text-foreground">
                    {post.headline}
                  </h2>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.summary}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                    <span>👁 {post.view_count || 0}</span>
                    <span>❤ {post.like_count || 0}</span>
                    <span>💬 {post.comment_count || 0}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}