import { PublicNav } from '@/components/public/PublicNav'
import { PublicFooter } from '@/components/public/PublicFooter'
import { Trophy, Calendar, Users } from 'lucide-react'

export const metadata = {
  title: 'Hackathons — DSRT',
  description: 'Discover hackathons and building competitions on DSRT.',
}

export default function HackathonsPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,180,50,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(10,30,80,0.4)_0%,transparent_60%)]" />
      </div>

      <PublicNav />

      <main className="relative pt-32 pb-32 px-4">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300 tracking-wider">
                DSRT HACKATHONS
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Ship something.
              <br />
              <span className="text-white/50">In 48 hours.</span>
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Real hackathons for real builders. Sponsored by real companies.
              With real prizes and real career opportunities.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Trophy, label: 'Active Hackathons', value: '12' },
              { icon: Users, label: 'Total Builders', value: '4,238' },
              { icon: Calendar, label: 'Upcoming Events', value: '8' },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 text-center"
                >
                  <Icon className="w-5 h-5 text-amber-400 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    {stat.label}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Coming Soon */}
          <div className="text-center py-20 space-y-4">
            <p className="text-white/40 text-sm uppercase tracking-widest">
              Hackathon browser coming next week
            </p>
            <p className="text-white/60 max-w-md mx-auto">
              Sign up for DSRT to be notified when new hackathons open for
              registration.
            </p>
            <div>
              <a
                href="/signup"
                className="inline-block mt-4 px-6 py-3 rounded-full bg-white text-black font-semibold hover:scale-105 transition-transform text-sm"
              >
                Get notified →
              </a>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}