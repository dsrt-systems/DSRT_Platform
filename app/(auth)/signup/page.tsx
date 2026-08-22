import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { HeroSection } from '@/components/landing/HeroSection'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { AuthShell } from '@/components/auth/AuthShell'
import { AuthErrorToast } from '@/components/auth/AuthErrorToast'
import { Snowflakes } from '@/components/shared/Snowflakes'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sign up — DSRT',
  description: 'Join the intelligent network for builders, projects, and ventures.',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#05070D] text-white flex flex-col relative overflow-hidden">
      <Suspense fallback={null}>
        <AuthErrorToast />
      </Suspense>

      {/* Gentle full-page falling snow */}
      <Snowflakes />

      <LandingHeader />

      <main className="flex-1 flex flex-col lg:flex-row w-full">
        {/* LEFT — Image & Hero (Hidden on small mobile to prioritize signup form) */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 relative p-12 xl:p-20 border-r border-white/[0.06]">
          {/* Static Background Image with Overlays */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen"
            style={{ backgroundImage: `url('/auth-bg.jpg')` }} 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05070D]/95 via-[#05070D]/75 to-[#05070D]/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070D] via-transparent to-[#05070D]/40" />

          {/* Content */}
          <div className="relative z-10">
            <HeroSection />
          </div>
        </div>

        {/* RIGHT — Auth Panel */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#05070D] relative z-10 w-full lg:w-1/2">
          {/* Note: initialView is 'signup' */}
          <AuthShell initialView="signup" /> 
        </div>
      </main>

      <div className="relative z-10">
        <LandingFooter />
      </div>
    </div>
  )
}