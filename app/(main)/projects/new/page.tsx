import { NewProjectForm } from '@/components/projects/NewProjectForm'

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Start a Project</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Open collaborative work. Hackathons, prototypes, research builds, or
          side projects.
        </p>
      </div>

      <NewProjectForm />
    </div>
  )
}