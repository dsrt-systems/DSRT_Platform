import { CreateProjectForm } from '@/components/projects/CreateProjectForm'

export default function NewProjectPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up your project workspace. You can always change these later.
        </p>
      </div>
      <CreateProjectForm />
    </div>
  )
}