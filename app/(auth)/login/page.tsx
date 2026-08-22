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
  title: 'Log in — DSRT',
  description: 'Log in to DSRT to continue building.',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#05070D] text-white flex flex-col relative overflow-hidden">
      <Suspense fallback={null}>
        <AuthErrorToast />
      </Suspense>

      {/* Soft snow over entire page */}
      <Snowflakes />

      <LandingHeader />

      <main className="flex-1 flex flex-col lg:flex-row w-full relative z-10">
        {/* LEFT — banner + hero */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 relative p-12 xl:p-20 border-r border-white/[0.06]">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('/auth-bg.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05070D]/95 via-[#05070D]/75 to-[#05070D]/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070D] via-transparent to-[#05070D]/40" />

          <div className="relative z-10">
            <HeroSection />
          </div>
        </div>

        {/* RIGHT — auth */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#05070D] w-full lg:w-1/2">
          <AuthShell initialView="signin" />
        </div>
      </main>

      <div className="relative z-10">
        <LandingFooter />
      </div>
    </div>
  )
}