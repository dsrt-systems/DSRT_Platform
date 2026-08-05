import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MyNetworkPage } from '@/components/network/MyNetworkPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  return <MyNetworkPage currentUser={profile} />
}