import { createClient } from '@/lib/supabase/server'
import { CommandCenter } from '@/components/home/CommandCenter'
import { ActiveProjects } from '@/components/home/ActiveProjects'
import { TodaysMission } from '@/components/home/TodaysMission'
import { AICopilot } from '@/components/home/AICopilot'
import { ActivityFeed } from '@/components/home/ActivityFeed'
import { BuildAnalytics } from '@/components/home/BuildAnalytics'
import { TeamWidget } from '@/components/home/TeamWidget'
import { QuickActions } from '@/components/home/QuickActions'
import { BuilderFeed } from '@/components/home/BuilderFeed'
import { AIInsights } from '@/components/home/AIInsights'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: profile },
    { data: projects },
    { data: tasks },
    { data: activities },
    { data: builderFeed },
    { data: buildStats },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', user!.id).single(),
    supabase.from('projects').select('*').eq('founder_id', user!.id).eq('status', 'active').order('updated_at', { ascending: false }).limit(5),
    supabase.from('project_tasks').select('*, projects(name, icon)').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('activity_events').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(6),
    supabase.from('builder_feed_items').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('build_stats').select('*').eq('user_id', user!.id).order('date', { ascending: false }).limit(7),
  ])

  const activeProjects = projects || []
  const primaryProject = activeProjects[0]

  return (
    <div className="flex">
      <div className="flex-1 p-4 md:p-6 space-y-4 min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CommandCenter project={primaryProject} />
          <ActiveProjects projects={activeProjects} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TodaysMission tasks={tasks || []} userId={user!.id} />
          <AICopilot userName={profile?.full_name?.split(' ')[0] || 'Builder'} />
          <ActivityFeed activities={activities || []} />
        </div>

        {/* AI Insights - full width when there's a primary project */}
        {primaryProject && (
          <AIInsights projectId={primaryProject.id} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <BuildAnalytics 
            stats={buildStats || []} 
            profile={profile}
            projectCount={activeProjects.length}
          />
          <QuickActions />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TeamWidget />
        </div>
      </div>

      <aside className="hidden xl:block w-80 border-l bg-background/30 flex-shrink-0">
        <BuilderFeed items={builderFeed || []} />
      </aside>
    </div>
  )
}