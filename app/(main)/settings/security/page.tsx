import { createClient } from '@/lib/supabase/server'
import { SecurityDashboard } from '@/components/security/SecurityDashboard'

export default async function SecurityPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: profile },
    { data: auditLogs },
    { data: loginHistory },
    { data: twoFA },
    { data: deletionRequest },
    { data: encryptedDocs },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', user!.id).single(),
    supabase.from('audit_logs').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('login_history').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('user_2fa').select('*').eq('user_id', user!.id).single(),
    supabase.from('account_deletion_requests').select('*').eq('user_id', user!.id).is('cancelled_at', null).is('completed_at', null).single(),
    supabase.from('encrypted_docs').select('id').eq('owner_id', user!.id),
  ])

  return (
    <SecurityDashboard
      profile={profile}
      auditLogs={auditLogs || []}
      loginHistory={loginHistory || []}
      twoFA={twoFA}
      deletionRequest={deletionRequest}
      encryptedDocsCount={encryptedDocs?.length || 0}
    />
  )
}