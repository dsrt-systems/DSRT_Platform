import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommunityPage } from '@/components/community/CommunityPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: myCommunitiesRaw } = await supabase
    .from('community_members')
    .select('communities(*)')
    .eq('user_id', user.id)

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .order('usage_count', { ascending: false })

  const { data: institution } = profile?.institution_id
    ? await supabase.from('institutions').select('id, name, short_name').eq('id', profile.institution_id).single()
    : { data: null }

  return (
    <CommunityPage
      currentUser={{ ...profile, institution }}
      myCommunities={(myCommunitiesRaw || []).map((m: any) => m.communities).filter(Boolean)}
      goals={goals || []}
    />
  )
}