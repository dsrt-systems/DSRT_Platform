'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Send, Plus, MessageSquare, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface MentorChatProps {
  user: any
  conversations: any[]
}

const SUGGESTED_STARTERS = [
  'I have an idea for a SaaS. How do I validate it?',
  'What should I focus on before raising a seed round?',
  'How do I find a technical co-founder?',
  'My MVP has no users. What am I doing wrong?',
  'Should I quit my job to work on my startup full-time?',
  'How do I price my B2B product?',
]

export function MentorChat({
  user,
  conversations: initialConvs,
}: MentorChatProps) {
  const supabase = createClient()
  const [conversations, setConversations] = useState(initialConvs)
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const loadConversation = async (convId: string) => {
    setActiveConvId(convId)
    const { data } = await supabase
      .from('mentor_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const startNewChat = () => {
    setActiveConvId(null)
    setMessages([])
  }

  const send = async (message?: string) => {
    const text = (message || input).trim()
    if (!text || sending) return

    setSending(true)
    setInput('')

    // Optimistic add
    const userMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversation_id: activeConvId,
        }),
      })

      const data = await res.json()

      if (data.error) {
        alert('Error: ' + data.error)
        setSending(false)
        return
      }

      // Set conversation ID if this was a new chat
      if (!activeConvId && data.conversation_id) {
        setActiveConvId(data.conversation_id)
        // Refresh conversations list
        const { data: convs } = await supabase
          .from('mentor_conversations')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(20)
        setConversations(convs || [])
      }

      // Add AI reply
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          created_at: new Date().toISOString(),
        },
      ])
    } catch (err) {
      alert('Something went wrong')
    }

    setSending(false)
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-3.5rem)] flex">
      {/* Sidebar */}
      <div className="w-72 border-r border-border/40 flex flex-col">
        <div className="p-3 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold">DSRT Mentor</h1>
          </div>
        </div>
        <div className="p-2">
          <Button
            onClick={startNewChat}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <Plus className="w-3.5 h-3.5 mr-2" />
            New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => loadConversation(c.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted/40 transition-colors ${
                activeConvId === c.id ? 'bg-muted/40' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs">{c.title || 'Untitled'}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.updated_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {messages.length === 0 && !sending ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">DSRT Mentor</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Elite AI advisor with knowledge of startups, engineering,
                  design, fundraising, and building. Ask anything.
                </p>
              </div>
              <div className="space-y-2 text-left">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold text-center mb-3">
                  Try asking
                </p>
                {SUGGESTED_STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="w-full p-3 text-sm text-left rounded-xl border border-border/40 hover:border-border hover:bg-muted/30 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-2xl mx-auto space-y-6">
              {messages.map((m) => (
                <div key={m.id} className="flex gap-3">
                  {m.role === 'user' ? (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {user.full_name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold mb-1">
                      {m.role === 'user' ? user.full_name : 'DSRT Mentor'}
                    </p>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {m.content}
                    </div>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold mb-1">DSRT Mentor</p>
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        <div className="p-4 border-t border-border/40">
          <div className="max-w-2xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Ask DSRT Mentor anything..."
              disabled={sending}
            />
            <Button
              onClick={() => send()}
              disabled={!input.trim() || sending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}