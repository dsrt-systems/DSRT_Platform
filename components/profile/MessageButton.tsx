'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { MessageCircle, Loader2 } from 'lucide-react'

interface MessageButtonProps {
  otherUserId: string
}

export function MessageButton({ otherUserId }: MessageButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)

    try {
      // Try to use the RPC function
      const { data, error } = await supabase.rpc(
        'get_or_create_dm_conversation',
        {
          other_user_id: otherUserId,
        }
      )

      if (error) {
        // Fallback: create conversation manually
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Check if conversation already exists
        const { data: existing } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id)

        const { data: otherExisting } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', otherUserId)

        const myConvIds = new Set(
          (existing || []).map((e) => e.conversation_id)
        )
        const match = (otherExisting || []).find((e) =>
          myConvIds.has(e.conversation_id)
        )

        if (match) {
          router.push('/messages')
          return
        }

        // Create new conversation
        const { data: conv } = await supabase
          .from('conversations')
          .insert({
            type: 'direct',
            created_by: user.id,
          })
          .select()
          .single()

        if (conv) {
          await supabase.from('conversation_participants').insert([
            { conversation_id: conv.id, user_id: user.id },
            { conversation_id: conv.id, user_id: otherUserId },
          ])
        }
      }

      router.push('/messages')
    } catch (err) {
      console.error(err)
      router.push('/messages')
    }

    setLoading(false)
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <MessageCircle className="w-4 h-4 mr-2" />
      )}
      Message
    </Button>
  )
}