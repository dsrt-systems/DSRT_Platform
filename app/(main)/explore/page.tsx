import { createClient } from '@/lib/supabase/server'
import { ExploreView } from '@/components/explore/ExploreView'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function ExplorePage() {
  const supabase = createClient()

  const [
    { data: builders },
    { data: projects },
    { data: ventures },
    { data: communities },
    { data: hackathons },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id, username, full_name, avatar_url, tagline, brings, interest_topics, location')
      .eq('onboarding_complete', true)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('projects')
      .select('*, users:creator_id(id, full_name, username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('startups')
      .select('*, users:founder_id(id, full_name, username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('communities')
      .select('*, institutions(*)')
      .order('member_count', { ascending: false })
      .limit(50),
    supabase
      .from('hackathons')
      .select('*')
      .order('start_date', { ascending: true })
      .limit(20),
  ])

  return (
    <ExploreView
      builders={builders || []}
      projects={projects || []}
      ventures={ventures || []}
      communities={communities || []}
      hackathons={hackathons || []}
    />
  )
}