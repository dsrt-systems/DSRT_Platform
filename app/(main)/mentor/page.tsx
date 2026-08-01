import { createClient } from '@/lib/supabase/server'
import { AIMentorChat } from '@/components/mentor/AIMentorChat'

export default async function MentorPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: profile },
    { data: conversations },
    { data: projects },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', user!.id).single(),
    supabase.from('ai_conversations').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('projects').select('id, name, icon, color').eq('founder_id', user!.id).eq('status', 'active'),
  ])

  return (
    <AIMentorChat
      user={profile}
      conversations={conversations || []}
      projects={projects || []}
    />
  )
}