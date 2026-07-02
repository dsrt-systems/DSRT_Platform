import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Building2, Users } from 'lucide-react'

export default async function CommunityListPage() {
  const supabase = createClient()

  const { data: communities } = await supabase
    .from('communities')
    .select('*, institutions(*)')
    .order('member_count', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Communities</h1>
        <p className="text-muted-foreground mt-1">
          Innovation hubs from institutions across India. Each community is a
          mini-campus.
        </p>
      </div>

      {!communities || communities.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No communities yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {communities.map((c) => (
            <Link
              key={c.id}
              href={`/community/${c.slug}`}
              className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-5 hover:border-border transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold">{c.name}</h3>
                    {c.is_verified && (
                      <span className="text-primary text-sm">✓</span>
                    )}
                  </div>
                  {c.institutions?.city && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {c.institutions.city}, {c.institutions.state}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {c.member_count} members
                    </span>
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