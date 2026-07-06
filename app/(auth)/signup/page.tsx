import { SignupForm } from '@/components/auth/SignupForm'
import { LogoSphere } from '@/components/shared/LogoSphere'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up — DSRT AI',
  description: 'Join DSRT AI — the professional builder ecosystem',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background flex relative">
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

        <div className="absolute top-0 left-0 right-0 z-10 p-8 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">
              DSRT AI
            </span>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center p-16">
          <div className="w-full h-full max-w-[500px] max-h-[500px]">
            <LogoSphere />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 p-10 pointer-events-none">
          <div className="space-y-3">
            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Join the
              <br />
              <span className="text-white/70">builder ecosystem.</span>
            </h2>
            <p className="text-sm text-white/50 max-w-md leading-relaxed">
              Where the next generation of founders, engineers, and designers
              find each other.
            </p>
          </div>

          <div className="mt-8 text-[10px] text-white/30 tracking-wider">
            © 2025 DSRT AI · dsrtai.com
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-8">
        <SignupForm />
      </div>

      <div className="absolute bottom-3 right-8 pointer-events-none">
        <p className="text-[10px] text-muted-foreground/40 font-light tracking-wide italic">
          dedicated to my beautiful wife hajra
        </p>
      </div>
    </div>
  )
}