import { PublicNav } from '@/components/public/PublicNav'
import { PublicFooter } from '@/components/public/PublicFooter'

export const metadata = {
  title: 'Social — DSRT',
}

export default function SocialPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(240,80,150,0.15)_0%,transparent_50%)]" />
      </div>

      <PublicNav />

      <main className="relative pt-32 pb-32 px-4">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Follow the
              <br />
              <span className="text-white/50">journey.</span>
            </h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Twitter', href: 'https://twitter.com/dsrtai' },
              { name: 'LinkedIn', href: 'https://linkedin.com/company/dsrtai' },
              { name: 'GitHub', href: 'https://github.com/dsrtai' },
              { name: 'Discord', href: '#' },
            ].map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 text-center hover:bg-white/[0.04] transition-all group"
              >
                <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  {s.name}
                </p>
                <p className="text-xs text-white/40 mt-1">→</p>
              </a>
            ))}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}