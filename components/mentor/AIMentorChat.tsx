'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Plus, MessageSquare, Zap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id?: string
  created_at?: string
}

interface AIMentorChatProps {
  user: any
  conversations: any[]
  projects: any[]
}

const suggestedPrompts = [
  { icon: '🎯', text: "What should I focus on today?" },
  { icon: '📊', text: "Analyze my current sprint progress" },
  { icon: '🤝', text: "Help me plan team structure" },
  { icon: '🚀', text: "How do I ship my MVP faster?" },
  { icon: '💡', text: "Validate this product idea for me" },
  { icon: '🔍', text: "Find risks in my project" },
]

export function AIMentorChat({ user, conversations, projects }: AIMentorChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text?: string) => {
    const message = text || input.trim()
    if (!message || sending) return

    setInput('')
    setSending(true)

    // Optimistic user message
    const userMsg: Message = { role: 'user', content: message }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await fetch('/api/ai/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId,
          projectId: selectedProject,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      // Update conversation ID for follow-ups
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId)
      }

      // Add assistant response
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (err: any) {
      toast.error(err.message)
      setMessages(prev => prev.slice(0, -1)) // Remove failed message
    } finally {
      setSending(false)
    }
  }

  const loadConversation = async (convoId: string) => {
    setConversationId(convoId)
    // TODO: Load messages from API
    // For now, just clear
    setMessages([])
  }

  const newConversation = () => {
    setConversationId(null)
    setMessages([])
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 border-r bg-muted/10">
        <div className="p-3 border-b">
          <Button onClick={newConversation} className="w-full gap-2" variant="outline">
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            Recent Chats
          </p>
          {conversations.length === 0 ? (
            <p className="px-2 py-4 text-xs text-muted-foreground text-center">
              No chats yet
            </p>
          ) : (
            conversations.map(convo => (
              <button
                key={convo.id}
                onClick={() => loadConversation(convo.id)}
                className={cn(
                  'w-full text-left px-2 py-2 rounded-lg hover:bg-muted transition-colors',
                  conversationId === convo.id && 'bg-muted'
                )}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-3 h-3 mt-1 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{convo.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(convo.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            Project Context
          </p>
          <select
            value={selectedProject || ''}
            onChange={e => setSelectedProject(e.target.value || null)}
            className="w-full text-xs px-2 py-1.5 border rounded-md bg-background"
          >
            <option value="">No project context</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold">DSRT Mentor</h1>
              <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded-md font-bold">
                ONLINE
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-500 rounded-md font-bold">
                POWERED BY ROBOTIC ROCKS
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Your AI advisor for building real things</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center py-12 space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Hey {user?.full_name?.split(' ')[0]}, what shall we build?
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  I know your projects, your team, your progress. Ask me anything.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-xl mx-auto">
                {suggestedPrompts.map(prompt => (
                  <button
                    key={prompt.text}
                    onClick={() => send(prompt.text)}
                    disabled={sending}
                    className="p-3 border rounded-xl text-left text-sm hover:bg-muted transition-colors flex items-center gap-3"
                  >
                    <span className="text-lg">{prompt.icon}</span>
                    <span>{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex gap-3',
                      msg.role === 'user' && 'justify-end'
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={cn(
                      'rounded-2xl px-4 py-2.5 max-w-[80%]',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {sending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-2.5">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Ask anything..."
                  disabled={sending}
                  className="w-full h-11 px-4 pr-12 bg-muted/40 border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/30 transition-all"
                />
                <button
                  onClick={() => send()}
                  disabled={sending || !input.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg flex items-center justify-center hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-2">
            DSRT Mentor is an AI assistant. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}