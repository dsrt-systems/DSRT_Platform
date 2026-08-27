import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HomePageV2 } from '@/components/home-v2/HomePageV2'
import { VerificationBanner } from '@/components/trust/VerificationBanner'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, username, full_name, avatar_url, tagline, is_verified, account_state')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col min-h-full">
      {/* Contextual Adaptive Trust Banner (Injects seamlessly above the feed without breaking layout) */}
      <div className="w-full max-w-[1024px] mx-auto px-4 md:px-6 pt-6 pb-2">
        <VerificationBanner />
      </div>
      
      <HomePageV2 currentUser={profile} />
    </div>
  )
}