import { PublicNav } from '@/components/public/PublicNav'
import { PublicFooter } from '@/components/public/PublicFooter'
import { Code2, Terminal, Zap } from 'lucide-react'

export const metadata = {
  title: 'Developers — DSRT',
  description: 'Build with DSRT APIs. Access mentor AI, matching, feeds.',
}

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,180,120,0.15)_0%,transparent_50%)]" />
      </div>

      <PublicNav />

      <main className="relative pt-32 pb-32 px-4">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300 tracking-wider">
                DSRT DEVELOPERS
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Build on DSRT.
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              APIs, SDKs, and tools to extend DSRT. Access the mentor engine,
              match users, integrate with the ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Zap,
                title: 'Mentor API',
                desc: 'Call DSRT Mentor from your app. Full context-aware AI advisor.',
              },
              {
                icon: Code2,
                title: 'Match Engine',
                desc: 'Find compatible builders based on skills, interests, and goals.',
              },
              {
                icon: Terminal,
                title: 'Webhook Events',
                desc: 'Real-time notifications when builders join, ship, or engage.',
              },
            ].map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 hover:bg-white/[0.04] transition-all"
                >
                  <Icon className="w-5 h-5 text-emerald-400 mb-3" />
                  <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-8">
            <p className="text-xs text-emerald-400 font-mono mb-3">
              // Coming soon
            </p>
            <pre className="text-sm text-white/70 font-mono overflow-x-auto">
              <code>{`import { DSRT } from '@dsrt/sdk'

const dsrt = new DSRT({ apiKey: process.env.DSRT_KEY })

const reply = await dsrt.mentor.ask({
  message: "How do I validate my SaaS idea?",
  userId: "user_123"
})`}</code>
            </pre>
          </div>

          <div className="text-center py-8">
            <p className="text-white/60 mb-4">
              Developer platform launching Q3 2025.
            </p>
            <a
              href="/signup"
              className="inline-block px-6 py-3 rounded-full bg-white text-black font-semibold hover:scale-105 transition-transform text-sm"
            >
              Join waitlist →
            </a>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}