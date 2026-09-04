// filepath: app/page.tsx
import { AuthLayout } from '@/components/auth/AuthLayout'
export const dynamic = 'force-dynamic'

export default function RootLandingPage() {
  // Uses Sign in as the default landing view.
  return <AuthLayout initialView="signin" />
}