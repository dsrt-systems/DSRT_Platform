import { createClient } from '@/lib/supabase/server'
import { MessagesView } from '@/components/messages/MessagesView'

export default async function MessagesPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get all conversations the user is in
  const { data: participations } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user!.id)

  const conversationIds = participations?.map((p) => p.conversation_id) || []

  const { data: conversations } = await supabase
    .from('conversations')
    .select(
      `
      *,
      conversation_participants(
        user_id,
        users(id, full_name, username, avatar_url, tagline)
      ),
      messages(content, created_at, sender_id)
    `
    )
    .in('id', conversationIds.length > 0 ? conversationIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false })

  return <MessagesView conversations={conversations || []} currentUserId={user!.id} />
}