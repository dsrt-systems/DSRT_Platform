import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProjectView } from '@/components/projects/ProjectView'

interface PageProps {
  params: { slug: string }
}

export default async function ProjectPage({ params }: PageProps) {
  const supabase = createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*, users:creator_id(*)')
    .eq('slug', params.slug)
    .single()

  if (!project) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: members }, { data: buildLogs }, { data: tasks }] =
    await Promise.all([
      supabase
        .from('project_members')
        .select('*, users(id, full_name, username, avatar_url, tagline)')
        .eq('project_id', project.id)
        .eq('status', 'active'),
      supabase
        .from('project_build_logs')
        .select('*, users(id, full_name, username, avatar_url)')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', project.id),
    ])

  const isMember = members?.some((m: any) => m.user_id === user?.id) || false
  const isCreator = project.creator_id === user?.id

  return (
    <ProjectView
      project={project}
      members={members || []}
      buildLogs={buildLogs || []}
      tasks={tasks || []}
      isMember={isMember}
      isCreator={isCreator}
      currentUserId={user?.id}
    />
  )
}