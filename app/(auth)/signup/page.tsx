import { SignupForm } from '@/components/auth/SignupForm'
import { LogoSphere } from '@/components/shared/LogoSphere'
import { PublicNav } from '@/components/public/PublicNav'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up — DSRT AI',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background flex relative">
      <PublicNav />

      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#050510] via-[#0a0f20] to-[#0f1830]">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 40%, rgba(74, 107, 160, 0.15) 0%, transparent 60%)',
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

      <div className="flex-1 flex items-center justify-center p-6 md:p-8 pt-24">
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