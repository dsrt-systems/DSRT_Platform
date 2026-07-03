import { createClient } from '@/lib/supabase/server'
import { MessagesView } from '@/components/messages/MessagesView'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { mentor?: string }
}

export default async function MessagesPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, username')
    .eq('id', user!.id)
    .single()

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
        is_archived,
        users(id, full_name, username, avatar_url, tagline, is_bot)
      ),
      messages(id, content, created_at, sender_id)
    `
    )
    .in(
      'id',
      conversationIds.length > 0
        ? conversationIds
        : ['00000000-0000-0000-0000-000000000000']
    )
    .order('created_at', { ascending: false })

  const { data: mentorConversations } = await supabase
    .from('mentor_conversations')
    .select('*')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })
    .limit(5)

  return (
    <MessagesView
      conversations={conversations || []}
      mentorConversations={mentorConversations || []}
      currentUser={profile}
      initialOpenMentor={searchParams.mentor === '1'}
    />
  )
}