import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Rocket } from 'lucide-react'

export default async function VenturesPage() {
  const supabase = createClient()

  const { data: ventures } = await supabase
    .from('startups')
    .select('*, users:founder_id(id, full_name, username, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ventures</h1>
          <p className="text-muted-foreground mt-1">
            Companies in progress. Long-term builds with a vision.
          </p>
        </div>
        <Button asChild>
          <Link href="/ventures/new">
            <Plus className="w-4 h-4 mr-1.5" />
            New Venture
          </Link>
        </Button>
      </div>

      {!ventures || ventures.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-12 text-center space-y-3">
          <div className="text-4xl">🚀</div>
          <h3 className="font-semibold">No ventures yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Be the first to start a venture on DSRT.
          </p>
          <Button asChild>
            <Link href="/ventures/new">Start a Venture</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ventures.map((v) => (
            <Link
              key={v.id}
              href={`/ventures/${v.slug}`}
              className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-5 hover:border-border transition-all"
            >
              <div className="flex items-start gap-3">
                {v.logo_url ? (
                  <img
                    src={v.logo_url}
                    alt={v.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
                    <Rocket className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold">{v.name}</h3>
                  {v.tagline && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                      {v.tagline}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="capitalize">{v.stage}</span>
                    <span>•</span>
                    <span>{v.member_count} members</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}