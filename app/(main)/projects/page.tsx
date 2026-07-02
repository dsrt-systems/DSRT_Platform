import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default async function ProjectsPage() {
  const supabase = createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('*, users:creator_id(id, full_name, username, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Open collaborative work from across the ecosystem
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="w-4 h-4 mr-1.5" />
            New Project
          </Link>
        </Button>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-12 text-center space-y-3">
          <div className="text-4xl">⚡</div>
          <h3 className="font-semibold">No projects yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Be the first to start a project on DSRT.
          </p>
          <Button asChild>
            <Link href="/projects/new">Start a Project</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.slug}`}
              className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-5 hover:border-border transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted capitalize">
                  {p.stage}
                </span>
                {p.is_hiring && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-rose-500/10 text-rose-500">
                    Hiring
                  </span>
                )}
              </div>
              <h3 className="font-bold">{p.title}</h3>
              {p.tagline && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {p.tagline}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <span>by {p.users?.full_name}</span>
                <span>•</span>
                <span>{p.member_count} members</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}