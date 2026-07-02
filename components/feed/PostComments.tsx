'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

interface PostCommentsProps {
  postId: string
  currentUser: any
}

export function PostComments({ postId, currentUser }: PostCommentsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [comments, setComments] = useState<any[]>([])
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    supabase
      .from('post_comments')
      .select('*, users(id, full_name, username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setComments(data || []))
  }, [postId])

  const handlePost = async () => {
    if (!text.trim()) return
    setPosting(true)
    const { data } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: currentUser.id,
        content: text.trim(),
      })
      .select('*, users(id, full_name, username, avatar_url)')
      .single()

    if (data) {
      setComments([...comments, data])
      setText('')
    }
    setPosting(false)
  }

  return (
    <div className="space-y-3 pt-3 border-t border-border/40">
      <div className="flex gap-2">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={currentUser.avatar_url} />
          <AvatarFallback className="text-xs">
            {currentUser.full_name?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePost()
            }}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-1.5 text-sm rounded-full bg-muted/40 border-0 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button
            size="sm"
            onClick={handlePost}
            disabled={!text.trim() || posting}
          >
            Post
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-2">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={c.users?.avatar_url} />
              <AvatarFallback className="text-xs">
                {c.users?.full_name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-muted/30 rounded-2xl px-3 py-2">
              <p className="text-xs font-semibold">{c.users?.full_name}</p>
              <p className="text-sm">{c.content}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(c.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}