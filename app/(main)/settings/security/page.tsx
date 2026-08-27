import { createClient } from '@/lib/supabase/server'
import { SecurityDashboard } from '@/components/security/SecurityDashboard'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SecurityPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch security footprint concurrently
  const [
    { data: profile },
    { data: securityEvents },
    { data: twoFA },
    { data: deletionRequest }
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('security_events').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(15),
    supabase.from('user_2fa').select('is_enabled').eq('user_id', user.id).maybeSingle(),
    supabase.from('account_deletion_requests').select('*').eq('user_id', user.id).is('cancelled_at', null).is('completed_at', null).maybeSingle()
  ])

  return (
    <SecurityDashboard
      profile={profile}
      securityEvents={securityEvents || []}
      initialMfaState={!!twoFA?.is_enabled}
      deletionRequest={deletionRequest}
    />
  )
}