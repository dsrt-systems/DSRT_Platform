import { createClient } from '@/lib/supabase/server'
import { CommunitiesDiscovery } from '@/components/communities/CommunitiesDiscovery'

export default async function CommunityPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: myCommunitiesData },
    { data: allCommunities },
    { data: investors },
  ] = await Promise.all([
    supabase
      .from('community_members')
      .select('community_id, communities(*)')
      .eq('user_id', user!.id),
    supabase
      .from('communities')
      .select('*')
      .eq('is_public', true)
      .order('member_count', { ascending: false })
      .limit(50),
    supabase
      .from('investor_profiles')
      .select('*')
      .eq('is_active', true)
      .order('is_verified', { ascending: false })
      .limit(20),
  ])

  const myCommunities = (myCommunitiesData || [])
    .map((m: any) => m.communities)
    .filter(Boolean)

  const myCommunityIds = new Set(myCommunities.map((c: any) => c.id))

  return (
    <CommunitiesDiscovery
      myCommunities={myCommunities}
      allCommunities={allCommunities || []}
      investors={investors || []}
      myCommunityIds={Array.from(myCommunityIds)}
    />
  )
}