import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InvestorDashboard } from '@/components/investor/InvestorDashboard'

export default async function InvestorPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Non-investors get redirected
  if (!profile?.is_investor) {
    redirect('/settings?tab=investor')
  }

  // Fetch dashboard data
  const [
    { data: watchlist },
    { data: newVentures },
    { data: trending },
    { data: myFocus },
  ] = await Promise.all([
    supabase
      .from('investor_watchlist')
      .select(
        '*, startups(id, name, slug, tagline, stage, category, logo_url, follower_count, member_count, founder_id, users:founder_id(full_name, username, avatar_url))'
      )
      .eq('investor_id', user!.id),
    supabase
      .from('startups')
      .select(
        '*, users:founder_id(full_name, username, avatar_url)'
      )
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('startups')
      .select(
        '*, users:founder_id(full_name, username, avatar_url)'
      )
      .order('follower_count', { ascending: false })
      .limit(10),
    supabase
      .from('startups')
      .select(
        '*, users:founder_id(full_name, username, avatar_url)'
      )
      .overlaps('category', profile.focus_sectors || [])
      .limit(15),
  ])

  return (
    <InvestorDashboard
      profile={profile}
      watchlist={watchlist || []}
      newVentures={newVentures || []}
      trending={trending || []}
      focusVentures={myFocus || []}
    />
  )
}