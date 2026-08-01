import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProjectWorkspace } from '@/components/projects/ProjectWorkspace'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!project) notFound()

  // Verify user has access
  const { data: role } = await supabase
    .from('project_roles')
    .select('*')
    .eq('project_id', project.id)
    .eq('user_id', user!.id)
    .single()

  if (!role && project.visibility === 'private') {
    notFound()
  }

  const [
    { data: tasks },
    { data: members },
    { data: sprints },
    { data: activities },
    { data: repos },
  ] = await Promise.all([
    supabase
      .from('project_tasks')
      .select('*, users:user_id(full_name, username, avatar_url)')
      .eq('project_id', project.id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase
      .from('project_roles')
      .select('*, users:user_id(id, full_name, username, avatar_url, tagline, last_active)')
      .eq('project_id', project.id)
      .eq('status', 'active'),
    supabase
      .from('sprints')
      .select('*')
      .eq('project_id', project.id)
      .order('number', { ascending: false }),
    supabase
      .from('activity_events')
      .select('*, actor:actor_id(full_name, username, avatar_url)')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('tracked_repos')
      .select('*')
      .eq('project_id', project.id),
  ])

  return (
    <ProjectWorkspace
      project={project}
      currentUser={user}
      currentUserRole={role}
      initialTasks={tasks || []}
      members={members || []}
      sprints={sprints || []}
      activities={activities || []}
      repos={repos || []}
    />
  )
}