'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Send, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

interface MessagesViewProps {
  conversations: any[]
  currentUserId: string
}

export function MessagesView({
  conversations,
  currentUserId,
}: MessagesViewProps) {
  const router = useRouter()
  const supabase = createClient()
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  const openConversation = async (conv: any) => {
    setSelected(conv)
    const { data } = await supabase
      .from('messages')
      .select('*, users:sender_id(id, full_name, avatar_url)')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !selected) return
    setSending(true)
    const { data } = await supabase
      .from('messages')
      .insert({
        conversation_id: selected.id,
        sender_id: currentUserId,
        content: newMessage.trim(),
      })
      .select('*, users:sender_id(id, full_name, avatar_url)')
      .single()

    if (data) {
      setMessages([...messages, data])
      setNewMessage('')
    }
    setSending(false)
  }

  const getOtherParticipant = (conv: any) => {
    return conv.conversation_participants?.find(
      (p: any) => p.user_id !== currentUserId
    )?.users
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-3.5rem)] flex">
      {/* Conversation list */}
      <div className="w-80 border-r border-border/40 flex flex-col">
        <div className="p-3 border-b border-border/40">
          <h1 className="text-xl font-bold mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search messages"
              className="pl-9 h-9 bg-muted/40 border-0"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-center p-8 space-y-2">
              <MessageCircle className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs text-muted-foreground">
                Start a conversation from a profile page.
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv)
              const lastMsg = conv.messages?.[conv.messages.length - 1]
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => openConversation(conv)}
                  className={`w-full flex items-start gap-3 px-3 py-3 hover:bg-muted/40 transition-colors text-left border-b border-border/40 ${
                    selected?.id === conv.id ? 'bg-muted/40' : ''
                  }`}
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={other?.avatar_url} />
                    <AvatarFallback>
                      {other?.full_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {other?.full_name}
                    </p>
                    {lastMsg && (
                      <p className="text-xs text-muted-foreground truncate">
                        {lastMsg.content}
                      </p>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <MessageCircle className="w-12 h-12 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-border/40 flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={getOtherParticipant(selected)?.avatar_url}
                />
                <AvatarFallback>
                  {getOtherParticipant(selected)?.full_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">
                  {getOtherParticipant(selected)?.full_name}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((m) => {
                const isMine = m.sender_id === currentUserId
                return (
                  <div
                    key={m.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${
                        isMine
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-3 border-t border-border/40 flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Type a message..."
              />
              <Button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}