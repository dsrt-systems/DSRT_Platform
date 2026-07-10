import { createClient } from '@/lib/supabase/server'
import { PublicNav } from '@/components/public/PublicNav'
import { PublicFooter } from '@/components/public/PublicFooter'
import { Trophy, Calendar, MapPin, Award, Shield } from 'lucide-react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'

export const metadata = {
  title: 'Hackathons — DSRT',
  description:
    'Verified hackathons on DSRT. Real events, real prizes, real builders.',
}

export const dynamic = 'force-dynamic'

export default async function HackathonsPage() {
  const supabase = createClient()

  const { data: hackathons } = await supabase
    .from('hackathons')
    .select('*, users:created_by(admin_role), communities:community_id(name, slug)')
    .eq('approved', true)
    .order('start_date', { ascending: true })

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,80,120,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(10,30,80,0.4)_0%,transparent_60%)]" />
      </div>

      <PublicNav />

      <main className="relative pt-32 pb-32 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 backdrop-blur-sm">
              <Trophy className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-xs font-semibold text-rose-300 tracking-wider">
                DSRT HACKATHONS
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Real hackathons.
              <br />
              <span className="text-white/50">Real builders.</span>
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Every hackathon on DSRT is verified by our editorial team. No spam.
              No fake events. Only real builders, real prizes, real career
              opportunities.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Trophy, label: 'Active', value: hackathons?.length || 0 },
              {
                icon: Shield,
                label: 'Verified',
                value: '100%',
              },
              {
                icon: Award,
                label: 'Total Prizes',
                value: '₹50L+',
              },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 text-center"
                >
                  <Icon className="w-5 h-5 text-rose-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    {stat.label}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Hackathon List */}
          {!hackathons || hackathons.length === 0 ? (
            <div className="rounded-3xl border-2 border-white/10 bg-white/[0.02] backdrop-blur-sm p-16 text-center space-y-4">
              <Trophy className="w-12 h-12 text-white/30 mx-auto" />
              <div>
                <h3 className="text-xl font-bold text-white">
                  No hackathons yet
                </h3>
                <p className="text-sm text-white/60 mt-2 max-w-md mx-auto">
                  DSRT editors are curating high-quality hackathons. Check back
                  soon or sign up to get notified.
                </p>
              </div>
              <Link
                href="/signup"
                className="inline-block mt-2 px-6 py-3 rounded-full bg-white text-black font-semibold hover:scale-105 transition-transform text-sm"
              >
                Get notified →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hackathons.map((h: any) => {
                const isOfficial =
                  h.users?.admin_role === 'dsrt_super_admin'

                return (
                  <Link
                    key={h.id}
                    href={`/hackathons/${h.slug}`}
                    className="group rounded-2xl border-2 border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent backdrop-blur-sm p-6 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-500/30">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="px-2 py-0.5 text-[9px] rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-widest font-bold">
                            {h.status}
                          </span>
                          {isOfficial && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[9px] uppercase tracking-widest font-bold">
                              <Shield className="w-2.5 h-2.5" />
                              Official
                            </span>
                          )}
                          <span className="text-[10px] text-white/50 uppercase tracking-wider">
                            {h.mode}
                          </span>
                        </div>

                        <h3 className="font-bold text-lg text-white group-hover:text-rose-300 transition-colors">
                          {h.title}
                        </h3>
                        {h.tagline && (
                          <p className="text-sm text-white/60 mt-1 line-clamp-2">
                            {h.tagline}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-3 text-xs text-white/50 flex-wrap">
                          {h.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(h.start_date), 'MMM d')}
                            </span>
                          )}
                          {h.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {h.location}
                            </span>
                          )}
                          {h.prize_pool && (
                            <span className="text-amber-400 font-medium">
                              🏆 {h.prize_pool}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}