import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsernameSelectionScreen } from '@/components/auth/UsernameSelectionScreen'
import { AuthShellFrame } from '@/components/auth/AuthShellFrame'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Choose username — DSRT' }

export default async function UsernamePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <AuthShellFrame>
      <UsernameSelectionScreen />
    </AuthShellFrame>
  )
}