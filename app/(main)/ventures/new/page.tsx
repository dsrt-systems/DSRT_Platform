import { NewVentureForm } from '@/components/ventures/NewVentureForm'

export default function NewVenturePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Start a Venture</h1>
        <p className="text-muted-foreground mt-1">
          A long-term build with a vision, team, and milestones. Companies in
          progress.
        </p>
      </div>

      <NewVentureForm />
    </div>
  )
}