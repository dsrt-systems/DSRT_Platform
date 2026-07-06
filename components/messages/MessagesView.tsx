'use client'

import { NewMessageDialog } from './NewMessageDialog'
import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search,
  Send,
  MessageCircle,
  Sparkles,
  Archive,
  ChevronDown,
  ChevronRight,
  Pin,
  Loader2,
  Plus,
  Check,
  CheckCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Markdown } from '@/components/shared/Markdown'

interface MessagesViewProps {
  conversations: any[]
  mentorConversations: any[]
  currentUser: any
  initialOpenMentor?: boolean
}

type ChatType = 'mentor' | 'user'
type SelectedChat = { type: ChatType; id: string | null; data?: any } | null

export function MessagesView({
  conversations,
  mentorConversations: initialMentorConvs,
  currentUser,
  initialOpenMentor = false,
}: MessagesViewProps) {
  const supabase = createClient()
  const [selected, setSelected] = useState<SelectedChat>(
    initialOpenMentor ? { type: 'mentor', id: null } : null
  )
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [mentorConvs, setMentorConvs] = useState(initialMentorConvs)
  const [hoveredDot, setHoveredDot] = useState<string | null>(null)
  const [newMessageOpen, setNewMessageOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeConvs = conversations.filter((c) => {
    const myPart = c.conversation_participants?.find(
      (p: any) => p.user_id === currentUser.id
    )
    return !myPart?.is_archived
  })
  const archivedConvs = conversations.filter((c) => {
    const myPart = c.conversation_participants?.find(
      (p: any) => p.user_id === currentUser.id
    )
    return myPart?.is_archived
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, sending])

  // Realtime for user messages
  useEffect(() => {
    if (!selected || selected.type !== 'user' || !selected.id) return

    const channel = supabase
      .channel(`chat:${selected.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selected.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as any
          const { data: sender } = await supabase
            .from('users')
            .select('id, full_name, avatar_url')
            .eq('id', newMsg.sender_id)
            .single()

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, { ...newMsg, users: sender }]
          })

          if (newMsg.sender_id !== currentUser.id) {
            await supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMsg.id)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selected.id}`,
        },
        (payload) => {
          const updated = payload.new as any
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updated.id
                ? {
                    ...m,
                    read_at: updated.read_at,
                    delivered_at: updated.delivered_at,
                  }
                : m
            )
          )
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [selected, currentUser.id])

  const openUserConversation = async (conv: any) => {
    setSelected({ type: 'user', id: conv.id, data: conv })
    const { data } = await supabase
      .from('messages')
      .select('*, users:sender_id(id, full_name, avatar_url)')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conv.id)
      .neq('sender_id', currentUser.id)
      .is('read_at', null)

    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conv.id)
      .eq('user_id', currentUser.id)
  }

  const openMentor = async (convId?: string) => {
    setSelected({ type: 'mentor', id: convId || null })

    if (convId) {
      const { data } = await supabase
        .from('mentor_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
      setMessages(data || [])
    } else {
      setMessages([])
    }
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !selected) return
    setSending(true)

    const content = newMessage.trim()
    setNewMessage('')

    if (selected.type === 'user') {
      await supabase.from('messages').insert({
        conversation_id: selected.id,
        sender_id: currentUser.id,
        content,
        type: 'text',
      })
    } else {
      const userMsg = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMsg])

      try {
        const res = await fetch('/api/mentor/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            conversation_id: selected.id,
          }),
        })
        const data = await res.json()

        if (data.reply) {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: data.reply,
              created_at: new Date().toISOString(),
            },
          ])

          if (!selected.id && data.conversation_id) {
            setSelected({ type: 'mentor', id: data.conversation_id })
            const { data: convs } = await supabase
              .from('mentor_conversations')
              .select('*')
              .eq('user_id', currentUser.id)
              .order('updated_at', { ascending: false })
              .limit(20)
            setMentorConvs(convs || [])
          }
        }
      } catch (err) {
        alert('Mentor error')
      }
    }

    setSending(false)
  }

  const toggleArchive = async (conv: any, e: React.MouseEvent) => {
    e.stopPropagation()
    const myPart = conv.conversation_participants?.find(
      (p: any) => p.user_id === currentUser.id
    )
    const newArchived = !myPart?.is_archived
    await supabase
      .from('conversation_participants')
      .update({ is_archived: newArchived })
      .eq('conversation_id', conv.id)
      .eq('user_id', currentUser.id)
    window.location.reload()
  }

  const getOtherParticipant = (conv: any) => {
    return conv.conversation_participants?.find(
      (p: any) => p.user_id !== currentUser.id
    )?.users
  }

  const isMentorSelected = selected?.type === 'mentor'
  const isUserSelected = selected?.type === 'user'

  const renderTicks = (msg: any) => {
    if (msg.sender_id !== currentUser.id) return null
    if (msg.read_at) return <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
    if (msg.delivered_at)
      return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground/60" />
    return <Check className="w-3.5 h-3.5 text-muted-foreground/60" />
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-3.5rem)] flex">
      {/* Left sidebar */}
      <div className="w-80 border-r border-border/40 flex flex-col">
        <div className="p-3 border-b border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">Messages</h1>
            <button
              type="button"
              onClick={() => setNewMessageOpen(true)}
              className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform"
              title="New message"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-9 h-9 bg-muted/40 border-0"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* PINNED MENTOR */}
          <div className="border-b border-border/40">
            <div className="px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Pin className="w-3 h-3 text-purple-500" />
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Pinned
                </p>
              </div>
              <button
                type="button"
                onClick={() => openMentor()}
                className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>

            <button
              type="button"
              onClick={() => openMentor()}
              className={cn(
                'w-full flex items-start gap-3 px-3 py-3 hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-pink-500/5 transition-colors text-left border-l-2',
                isMentorSelected && !selected?.id
                  ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500'
                  : 'border-transparent'
              )}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-2.5 h-2.5 text-white"
                    fill="currentColor"
                  >
                    <path d="M9.5 16.5L4 11l1.4-1.4L9.5 13.7l9.1-9.1L20 6l-10.5 10.5z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="font-semibold text-sm">DSRT Mentor</p>
                  <span className="text-[9px] bg-purple-500/20 text-purple-500 px-1.5 py-0.5 rounded font-bold">
                    AI
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  Your personal AI mentor
                </p>
              </div>
            </button>
          </div>

          {activeConvs.length === 0 ? (
            <div className="text-center p-6 space-y-2">
              <MessageCircle className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground">
                No conversations yet
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                Visit a profile and click Message
              </p>
            </div>
          ) : (
            <>
              <div className="px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Conversations
                </p>
              </div>
              {activeConvs.map((conv) => {
                const other = getOtherParticipant(conv)
                const lastMsg = conv.messages?.[conv.messages.length - 1]
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => openUserConversation(conv)}
                    className={cn(
                      'w-full flex items-start gap-3 px-3 py-3 hover:bg-muted/40 transition-colors text-left border-b border-border/40 group',
                      isUserSelected && selected?.id === conv.id
                        ? 'bg-muted/40'
                        : ''
                    )}
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
                    <button
                      type="button"
                      onClick={(e) => toggleArchive(conv, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-background transition-all"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </button>
                )
              })}
            </>
          )}

          {archivedConvs.length > 0 && (
            <div className="border-t border-border/40 mt-2">
              <button
                type="button"
                onClick={() => setShowArchived(!showArchived)}
                className="w-full flex items-center justify-between px-3 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Archive className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">
                    Archived ({archivedConvs.length})
                  </span>
                </div>
                {showArchived ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>

              {showArchived &&
                archivedConvs.map((conv) => {
                  const other = getOtherParticipant(conv)
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => openUserConversation(conv)}
                      className="w-full flex items-start gap-3 px-3 py-3 hover:bg-muted/40 transition-colors text-left border-b border-border/40 group opacity-70"
                    >
                      <Avatar className="w-9 h-9 flex-shrink-0">
                        <AvatarImage src={other?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {other?.full_name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {other?.full_name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => toggleArchive(conv, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-background transition-all text-primary"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </button>
                  )
                })}
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex">
        {/* Main chat window */}
        <div className="flex-1 flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3 max-w-md">
                <MessageCircle className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Select a conversation or ask DSRT Mentor
                </p>
                <Button onClick={() => openMentor()} className="mt-2">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Chat with Mentor
                </Button>
              </div>
            </div>
          ) : isMentorSelected ? (
            <>
              <div className="px-4 py-3 border-b border-border/40 flex items-center gap-3 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-2.5 h-2.5 text-white"
                      fill="currentColor"
                    >
                      <path d="M9.5 16.5L4 11l1.4-1.4L9.5 13.7l9.1-9.1L20 6l-10.5 10.5z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm">DSRT Mentor</p>
                    <span className="text-[9px] bg-purple-500/20 text-purple-500 px-1.5 py-0.5 rounded font-bold">
                      AI
                    </span>
                  </div>
                  <p className="text-xs text-emerald-500">● Online</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-2xl mx-auto space-y-6">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          Hi {currentUser.full_name?.split(' ')[0]}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                          I&apos;m your DSRT Mentor. I know your profile and your
                          ventures. What&apos;s on your mind?
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-w-md mx-auto pt-4">
                        {[
                          'How do I validate my idea?',
                          'What should I build next?',
                          'How do I find a co-founder?',
                          'Should I raise money now?',
                        ].map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setNewMessage(q)}
                            className="text-left p-3 text-sm rounded-xl border border-border/40 hover:border-border hover:bg-muted/30 transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} className="flex gap-3">
                        {m.role === 'user' ? (
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={currentUser.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {currentUser.full_name?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-xs font-semibold">
                              {m.role === 'user'
                                ? currentUser.full_name
                                : 'DSRT Mentor'}
                            </p>
                            {m.role === 'assistant' && (
                              <svg
                                viewBox="0 0 24 24"
                                className="w-3 h-3 text-emerald-500"
                                fill="currentColor"
                              >
                                <path d="M9.5 16.5L4 11l1.4-1.4L9.5 13.7l9.1-9.1L20 6l-10.5 10.5z" />
                              </svg>
                            )}
                          </div>
                          {m.role === 'assistant' ? (
                            <Markdown content={m.content} />
                          ) : (
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                              {m.content}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {sending && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold mb-1">
                          DSRT Mentor
                        </p>
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
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
                  placeholder="Ask DSRT Mentor anything..."
                  disabled={sending}
                />
                <Button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-border/40 flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage
                    src={getOtherParticipant(selected.data)?.avatar_url}
                  />
                  <AvatarFallback>
                    {getOtherParticipant(
                      selected.data
                    )?.full_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {getOtherParticipant(selected.data)?.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{getOtherParticipant(selected.data)?.username}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    Start the conversation.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.sender_id === currentUser.id
                    return (
                      <div
                        key={m.id}
                        className={`flex ${
                          isMine ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs md:max-w-md px-3 py-2 rounded-2xl text-sm ${
                            isMine
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          <div
                            className={`flex items-center gap-1 mt-1 text-[10px] ${
                              isMine
                                ? 'text-primary-foreground/60 justify-end'
                                : 'text-muted-foreground'
                            }`}
                          >
                            <span>
                              {formatDistanceToNow(new Date(m.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                            {renderTicks(m)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
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

        {/* Dot sidebar for Mentor history (only when mentor is selected) */}
        {isMentorSelected && mentorConvs.length > 0 && (
          <div className="hidden md:flex w-14 border-l border-border/40 flex-col items-center py-4 gap-2 bg-muted/10">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 rotate-180" style={{ writingMode: 'vertical-rl' }}>
              History
            </p>
            <button
              type="button"
              onClick={() => openMentor()}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                !selected?.id
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                  : 'bg-muted hover:bg-muted/60'
              )}
              title="New chat"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            <div className="w-8 h-px bg-border/40 my-1" />

            {mentorConvs.map((mc) => {
              const isActive = selected?.id === mc.id
              const isHovered = hoveredDot === mc.id
              return (
                <div key={mc.id} className="relative">
                  <button
                    type="button"
                    onClick={() => openMentor(mc.id)}
                    onMouseEnter={() => setHoveredDot(mc.id)}
                    onMouseLeave={() => setHoveredDot(null)}
                    className={cn(
                      'w-3 h-3 rounded-full transition-all',
                      isActive
                        ? 'bg-purple-500 scale-125'
                        : 'bg-muted-foreground/40 hover:bg-purple-400 hover:scale-110'
                    )}
                  />
                  {isHovered && (
                    <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap">
                      <div className="bg-popover border border-border shadow-lg rounded-lg px-3 py-2 text-xs max-w-[240px]">
                        <p className="font-medium truncate">
                          {mc.title || 'Untitled'}
                        </p>
                        <p className="text-muted-foreground text-[10px] mt-0.5">
                          {formatDistanceToNow(new Date(mc.updated_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
            <NewMessageDialog
        open={newMessageOpen}
        onOpenChange={setNewMessageOpen}
        currentUserId={currentUser.id}
      />
    </div>
  )
}