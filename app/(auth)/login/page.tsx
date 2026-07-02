import { LoginForm } from '@/components/auth/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login — DSRT',
  description: 'Log in to DSRT',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex relative">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 flex-col justify-between p-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">DSRT</h1>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Build with the
            <br />
            right people.
          </h2>
          <p className="text-lg text-muted-foreground max-w-md">
            The platform where builders, founders, and visionaries
            find each other and build real things together.
          </p>
          <div className="space-y-3">
            {[
              'Connect with builders from your institution',
              'Find co-founders who complement your skills',
              'Track your journey from idea to launch',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            © 2025 DSRT. Building the future, together.
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <LoginForm />
      </div>

      {/* Personal dedication — subtle at bottom */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
        <p className="text-[10px] text-muted-foreground/40 font-light tracking-wide italic">
          dedicated to my beautiful wife hajra
        </p>
      </div>
    </div>
  )
}