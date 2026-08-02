import { createClient } from '@/lib/supabase/server'
import { VenturesListView } from '@/components/ventures/VenturesListView'

export default async function VenturesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: myVentures },
    { data: allVentures },
  ] = await Promise.all([
    supabase
      .from('ventures')
      .select('*')
      .eq('user_id', user!.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('ventures')
      .select('*, users:user_id(full_name, username, avatar_url)')
      .eq('is_building_public', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return (
    <VenturesListView 
      myVentures={myVentures || []} 
      allVentures={allVentures || []}
      currentUserId={user!.id}
    />
  )
}