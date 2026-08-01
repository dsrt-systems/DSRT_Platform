import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function ProjectsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('founder_id', user!.id)
    .order('updated_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {projects?.length || 0} project{(projects?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="bg-card border rounded-2xl p-16 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No projects yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Create your first project to start tracking progress,
            managing tasks, and collaborating with your team.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Your First Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <Link
              key={project.id}
              href={`/projects/${project.slug}`}
              className="bg-card border rounded-2xl p-5 hover:border-primary/30 transition-all group space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-${project.color || 'blue'}-500 flex items-center justify-center text-white font-bold text-lg`}>
                  {project.icon || project.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate group-hover:text-primary transition-colors">
                    {project.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {project.sector} {project.category?.length ? `• ${project.category.join(', ')}` : ''}
                  </p>
                </div>
              </div>

              {project.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {project.completed_tasks || 0}/{project.total_tasks || 0} tasks
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-${project.color || 'blue'}-500 rounded-full`}
                      style={{ width: `${project.progress_percent || 0}%` }}
                    />
                  </div>
                  <span className="font-bold">{project.progress_percent || 0}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t">
                <span className="capitalize">{project.visibility}</span>
                <span>{project.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}