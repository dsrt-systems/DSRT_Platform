import { PublicNav } from '@/components/public/PublicNav'
import { PublicFooter } from '@/components/public/PublicFooter'

export const metadata = {
  title: 'Company — DSRT',
}

export default function CompanyPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(80,50,180,0.15)_0%,transparent_50%)]" />
      </div>

      <PublicNav />

      <main className="relative pt-32 pb-32 px-4">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              The company
              <br />
              <span className="text-white/50">behind DSRT.</span>
            </h1>
            <p className="text-lg text-white/60 leading-relaxed">
              DSRT was founded on a simple belief: the next generation of great
              companies will come from unlikely places. Not just IIT Bombay or
              Stanford. From CGEC. From NIT Durgapur. From tier-2 towns and
              small colleges.
            </p>
            <p className="text-lg text-white/60 leading-relaxed">
              But those builders lack access — to co-founders, to mentors, to
              capital, to community. DSRT is building the infrastructure that
              closes that gap. Powered by AI. Built for real people.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Founded', value: '2025' },
              { label: 'Headquarters', value: 'India' },
              { label: 'Team', value: 'Building fast' },
              { label: 'Status', value: 'Early access' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6"
              >
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
                  {s.label}
                </p>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-8 space-y-4">
            <h2 className="text-2xl font-bold text-white">Get in touch</h2>
            <p className="text-white/60">
              Investor? Partner? Media? Reach out at{' '}
              <a
                href="mailto:hello@dsrtai.com"
                className="text-emerald-400 hover:underline"
              >
                hello@dsrtai.com
              </a>
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}