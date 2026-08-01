import { createClient } from '@/lib/supabase/server'
import { IntegrationsHub } from '@/components/integrations/IntegrationsHub'

export default async function IntegrationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: integrations } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', user!.id)

  const { data: trackedRepos } = await supabase
    .from('tracked_repos')
    .select('*')
    .eq('user_id', user!.id)
    .eq('provider', 'github')

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <IntegrationsHub 
        integrations={integrations || []}
        trackedRepos={trackedRepos || []}
      />
    </div>
  )
}
