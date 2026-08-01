import { createClient } from '@/lib/supabase/server'
import { LeaderboardView } from '@/components/leaderboard/LeaderboardView'

export default async function LeaderboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: topBuilders },
    { data: topProjects },
    { data: topCommunities },
  ] = await Promise.all([
    supabase.from('leaderboard_builders').select('*').limit(100),
    supabase.from('leaderboard_projects').select('*').limit(50),
    supabase.from('leaderboard_communities').select('*').limit(50),
  ])

  return (
    <LeaderboardView
      builders={topBuilders || []}
      projects={topProjects || []}
      communities={topCommunities || []}
      currentUserId={user!.id}
    />
  )
}