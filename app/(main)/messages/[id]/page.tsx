import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ConversationView } from '@/components/messages/ConversationView'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ConversationPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify user is participant
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('*')
    .eq('conversation_id', id)
    .eq('user_id', user!.id)
    .is('left_at', null)
    .maybeSingle()

  if (!participant) notFound()

  // Get conversation with other participants
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single()

  if (!conversation) notFound()

  // Get other participants
  const { data: otherParticipants } = await supabase
    .from('conversation_participants')
    .select('users:user_id (id, full_name, username, avatar_url, tagline)')
    .eq('conversation_id', id)
    .neq('user_id', user!.id)
    .is('left_at', null)

  // Get messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:sender_id(id, full_name, username, avatar_url)')
    .eq('conversation_id', id)
    .eq('deleted', false)
    .order('created_at', { ascending: true })
    .limit(100)

  // Mark as read
  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', id)
    .eq('user_id', user!.id)

  return (
    <ConversationView
      conversation={conversation}
      otherParticipants={(otherParticipants || []).map((p: any) => p.users).filter(Boolean)}
      initialMessages={messages || []}
      currentUserId={user!.id}
    />
  )
}