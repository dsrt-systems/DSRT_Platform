import { LoginForm } from '@/components/auth/LoginForm'
import { LogoSphere } from '@/components/shared/LogoSphere'
import { PublicNav } from '@/components/public/PublicNav'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DSRT AI — Build with the right people',
  description:
    'DSRT AI is the professional builder ecosystem. Join thousands of founders, engineers, designers, and investors.',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex relative">
      <PublicNav />

      {/* Left — 3D sphere + branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#050510] via-[#0a0f20] to-[#0f1830]">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 40%, rgba(74, 107, 160, 0.15) 0%, transparent 60%)',
          }}
        />

        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center p-16">
          <div className="w-full h-full max-w-[500px] max-h-[500px]">
            <LogoSphere />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 p-10 pointer-events-none">
          <div className="space-y-3">
            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Build with the
              <br />
              <span className="text-white/70">right people.</span>
            </h2>
            <p className="text-sm text-white/50 max-w-md leading-relaxed">
              The AI-native builder ecosystem for founders, engineers,
              designers, and investors.
            </p>
          </div>

          <div className="mt-8 space-y-2">
            {[
              'Find co-founders across institutions',
              'Ship projects with real collaborators',
              'Get AI-powered advice, 24/7',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2.5 text-xs text-white/60"
              >
                <div className="w-1 h-1 rounded-full bg-white/40" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-[10px] text-white/30 tracking-wider">
            © 2025 DSRT AI · dsrtai.com
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8 pt-24">
        <LoginForm />
      </div>

      <div className="absolute bottom-3 right-8 pointer-events-none">
        <p className="text-[10px] text-muted-foreground/40 font-light tracking-wide italic">
          dedicated to my beautiful wife hajra
        </p>
      </div>
    </div>
  )
}