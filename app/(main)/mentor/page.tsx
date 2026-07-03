import { createClient } from '@/lib/supabase/server'
import { MentorChat } from '@/components/mentor/MentorChat'

export default async function MentorPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, avatar_url')
    .eq('id', user!.id)
    .single()

  const { data: conversations } = await supabase
    .from('mentor_conversations')
    .select('*')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })
    .limit(20)

  return <MentorChat user={profile} conversations={conversations || []} />
}