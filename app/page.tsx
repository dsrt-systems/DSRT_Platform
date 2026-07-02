import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function HomePage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single()

    if (profile?.onboarding_complete) {
      redirect('/feed')
    } else {
      redirect('/onboarding')
    }
  }

  return <LandingPage />
}