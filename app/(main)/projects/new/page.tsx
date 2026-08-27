import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrustGuard } from '@/components/trust/TrustGuard'
import { CreateProjectForm } from '@/components/projects/CreateProjectForm'

export const dynamic = 'force-dynamic'

export default async function NewProjectPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('trust_score, email_verification_status')
    .eq('id', user.id)
    .single()

  const isVerified = profile?.email_verification_status === 'VERIFIED'
  const trustScore = profile?.trust_score || 0

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Create a Project</h1>
        <p className="text-sm text-white/50 mt-1">Start building your next big idea on DSRT.</p>
      </div>

      <TrustGuard 
        actionName="Create a Project"
        trustScore={trustScore}
        isVerified={isVerified}
        minScore={30}
        requireVerification={false}
      >
        <CreateProjectForm />
      </TrustGuard>
    </div>
  )
}