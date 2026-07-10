import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AdminNav } from '@/components/admin/AdminNav'
import { Trophy, Plus, Calendar, Users } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function AdminHackathonsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: hackathons } = await supabase
    .from('hackathons')
    .select('*, community_admins:community_id(users(*))')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminNav profile={profile} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Hackathon Management</h1>
            <p className="text-sm text-white/60 mt-1">
              Create and manage DSRT hackathons
            </p>
          </div>
          <Link
            href="/admin/hackathons/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" />
            Create Hackathon
          </Link>
        </div>

        {!hackathons || hackathons.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-12 text-center space-y-3">
            <Trophy className="w-10 h-10 text-white/40 mx-auto" />
            <p className="text-white/60">No hackathons yet</p>
            <p className="text-sm text-white/40">
              Create your first hackathon to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hackathons.map((h: any) => (
              <Link
                key={h.id}
                href={`/admin/hackathons/${h.slug}`}
                className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-5 hover:bg-white/[0.04] hover:border-white/20 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
                          h.approved
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {h.approved ? 'Live' : 'Draft'}
                      </span>
                    </div>
                    <h3 className="font-bold text-white">{h.title}</h3>
                    {h.tagline && (
                      <p className="text-sm text-white/60 line-clamp-1 mt-1">
                        {h.tagline}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-white/50">
                      {h.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(h.start_date), 'MMM d')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {h.participants || 0} registered
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}