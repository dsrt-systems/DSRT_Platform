import { SignupForm } from '@/components/auth/SignupForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up — DSRT',
  description: 'Create your DSRT account',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <SignupForm />
    </div>
  )
}
