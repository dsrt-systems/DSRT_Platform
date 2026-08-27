import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SecurityDashboard } from '@/components/security/SecurityDashboard'

export const dynamic = 'force-dynamic'

export default async function SecurityPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: securityEvents },
    { data: twoFA }
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id, email, username, full_name, email_verification_status, trust_level, trust_score, verification_readiness_score')
      .eq('id', user.id)
      .single(),
    supabase
      .from('security_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15),
    supabase
      .from('user_2fa')
      .select('is_enabled')
      .eq('user_id', user.id)
      .maybeSingle()
  ])

  return (
    <SecurityDashboard
      profile={profile}
      securityEvents={securityEvents || []}
      initialMfaState={!!twoFA?.is_enabled}
    />
  )
}