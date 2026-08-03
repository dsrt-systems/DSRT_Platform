import { createClient } from '@/lib/supabase/server'
import { CommunityPage } from '@/components/community/CommunityPage'

export default async function Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Get user's communities
  const { data: myCommunities } = await supabase
    .from('community_members')
    .select('communities(*)')
    .eq('user_id', user!.id)

  // Get goals list
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .order('usage_count', { ascending: false })

  return (
    <CommunityPage
      currentUser={profile}
      myCommunities={(myCommunities || []).map((m: any) => m.communities).filter(Boolean)}
      goals={goals || []}
    />
  )
}