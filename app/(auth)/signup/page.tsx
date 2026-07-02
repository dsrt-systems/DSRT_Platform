import { SignupForm } from '@/components/auth/SignupForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up — DSRT',
  description: 'Create your DSRT account',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8 relative">
      <SignupForm />

      {/* Personal dedication — subtle at bottom */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
        <p className="text-[10px] text-muted-foreground/40 font-light tracking-wide italic">
          dedicated to my beautiful wife hajra
        </p>
      </div>
    </div>
  )
}