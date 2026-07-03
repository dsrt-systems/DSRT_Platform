'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

interface MessageButtonProps {
  otherUserId: string
}

export function MessageButton({ otherUserId }: MessageButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_or_create_dm_conversation', {
      other_user_id: otherUserId,
    })

    setLoading(false)

    if (error) {
      alert('Could not start conversation: ' + error.message)
      return
    }

    router.push(`/messages`)
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      <MessageCircle className="w-4 h-4 mr-2" />
      Message
    </Button>
  )
}