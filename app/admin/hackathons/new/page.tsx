import { createClient } from '@/lib/supabase/server'
import { AdminNav } from '@/components/admin/AdminNav'
import { HackathonForm } from '@/components/admin/HackathonForm'

export const dynamic = 'force-dynamic'

export default async function NewHackathonPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: communities } = await supabase
    .from('communities')
    .select('id, name')
    .order('name')

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminNav profile={profile} />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create Hackathon</h1>
          <p className="text-sm text-white/60 mt-1">
            AI will help generate content, but you decide the details.
          </p>
        </div>

        <HackathonForm
          communities={communities || []}
          adminRole={profile.admin_role}
        />
      </main>
    </div>
  )
}