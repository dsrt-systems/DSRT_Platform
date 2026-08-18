import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HomePageV2 } from '@/components/home-v2/HomePageV2'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, username, full_name, avatar_url, tagline, is_verified')
    .eq('id', user.id)
    .single()

  return <HomePageV2 currentUser={profile} />
}