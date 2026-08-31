'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Archive, Trash, Clock, Printer, Warning, Star
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useComposer } from './composer/ComposerContext'
import { MessageCard } from './reading/MessageCard'
import { QuickReplyBar } from './reading/QuickReplyBar'

interface Props {
  threadId: string
}

export function ThreadDetailPage({ threadId }: Props) {
  const router = useRouter()
  const { openCompose } = useComposer()
  const [thread, setThread] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [smartReplyIdentityId, setSmartReplyIdentityId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeReplyMode, setActiveReplyMode] = useState<'reply' | 'reply_all' | 'forward' | null>(null)

  const loadThread = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/mail/threads/${threadId}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load thread')

      setThread(data.thread)
      setMessages(data.messages || [])
      setParticipants(data.participants || [])
      setSmartReplyIdentityId(data.smart_reply_identity_id)
    } catch (e: any) {
      setError(e.message || 'Failed to load thread')
    } finally {
      setLoading(false)
    }
  }, [threadId])

  useEffect(() => { loadThread() }, [loadThread])

  const updateThreadState = async (updates: any, msg: string) => {
    try {
      await fetch(`/api/mail/threads/${threadId}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      toast.success(msg)
      if (updates.is_archived || updates.is_trashed) router.push('/inbox')
      else loadThread()
    } catch {
      toast.error('Action failed')
    }
  }

  const handleReplyInComposer = (mode: 'reply' | 'reply_all' | 'forward') => {
    if (!thread || messages.length === 0) return
    const lastMessage = messages[messages.length - 1]
    const sender = lastMessage.sender_identity

    let subject = thread.subject || ''
    if (mode === 'reply' || mode === 'reply_all') {
      if (!subject.toLowerCase().startsWith('re:')) subject = `Re: ${subject}`
    } else if (mode === 'forward') {
      if (!subject.toLowerCase().startsWith('fwd:')) subject = `Fwd: ${subject}`
    }

    let to: any[] = []
    let cc: any[] = []

    if (mode === 'reply' && sender && sender.id !== smartReplyIdentityId) {
      to = [sender]
    } else if (mode === 'reply_all') {
      const uniqueParts = Array.from(new Map(
        participants.filter(p => p.identity && p.identity.id !== smartReplyIdentityId).map(p => [p.identity_id, p])
      ).values())
      to = uniqueParts.filter(p => p.role === 'to' || p.role === 'from').map(p => p.identity)
      cc = uniqueParts.filter(p => p.role === 'cc').map(p => p.identity)
    }

    let quotedBody = ''
    if (mode === 'forward' || mode === 'reply' || mode === 'reply_all') {
      quotedBody = `<br/><br/><blockquote style="border-left:2px solid rgba(255,255,255,0.2);padding-left:12px;margin:12px 0;color:rgba(255,255,255,0.5);">
On ${new Date(lastMessage.sent_at).toLocaleString()}, ${sender?.display_name || 'Unknown'} wrote:<br/><br/>
${lastMessage.body_html || lastMessage.body_text || ''}
</blockquote>`
    }

    openCompose({
      mode,
      from_identity_id: smartReplyIdentityId || undefined,
      to, cc, subject,
      body_html: quotedBody,
      reply_to_thread_id: mode === 'forward' ? undefined : threadId,
      reply_to_message_id: mode === 'forward' ? undefined : lastMessage.id,
    })
  }

  const isStarred = thread?.participant_state?.is_starred

  return (
    <div className="fixed top-[76px] bottom-0 left-0 md:left-56 right-0 flex flex-col bg-[#050508] text-white z-40">
      {/* Top Action Bar */}
      <div className="h-14 px-4 md:px-6 border-b border-white/[0.08] bg-[#0a0a0f] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/inbox')}
            className="flex items-center gap-1.5 h-9 px-3 rounded-full hover:bg-white/[0.06] text-white/80 hover:text-white text-[13px] font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Inbox</span>
          </button>

          <div className="w-px h-5 bg-white/[0.1] mx-2" />

          <button onClick={() => updateThreadState({ is_archived: true }, 'Archived')} className="w-9 h-9 rounded-full hover:bg-white/[0.08] text-white/60 hover:text-white flex items-center justify-center transition-colors" title="Archive">
            <Archive className="w-[18px] h-[18px]" />
          </button>
          <button onClick={() => updateThreadState({ is_trashed: true }, 'Deleted')} className="w-9 h-9 rounded-full hover:bg-red-500/15 text-white/60 hover:text-red-400 flex items-center justify-center transition-colors" title="Delete">
            <Trash className="w-[18px] h-[18px]" />
          </button>
        </div>

        <button onClick={() => window.print()} className="w-9 h-9 rounded-full hover:bg-white/[0.08] text-white/60 hover:text-white flex items-center justify-center transition-colors" title="Print">
          <Printer className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Main Mail Body */}
      <div className="flex-1 overflow-y-auto px-4 py-8 md:px-12 lg:px-20 bg-[#050508]">
        <div className="max-w-4xl mx-auto w-full">
          
          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-8 bg-white/[0.04] rounded-lg w-2/3 mb-10" />
              <div className="h-40 bg-white/[0.02] rounded-xl" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <Warning className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-[14px] text-white/60 mb-4">{error}</p>
              <button onClick={loadThread} className="text-[13px] font-medium text-white border border-white/[0.1] hover:bg-white/[0.05] px-4 py-1.5 rounded-md">
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Subject Header */}
              <div className="flex items-start justify-between gap-6 pb-6 pl-2 sm:pl-[54px] pr-2">
                <div>
                  <h1 className="text-[20px] md:text-[24px] font-normal text-white/95 leading-tight break-words font-sans">
                    {thread?.subject || '(no subject)'}
                  </h1>
                  {thread?.source_type && (
                    <span className="inline-block mt-2 text-[10.5px] font-medium text-white/50 bg-white/[0.05] px-2 py-0.5 rounded uppercase tracking-wider">
                      {thread.source_type}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => updateThreadState({ is_starred: !isStarred }, isStarred ? 'Unstarred' : 'Starred')}
                  className={cn(
                    "w-9 h-9 rounded-full hover:bg-white/[0.06] flex items-center justify-center transition-colors flex-shrink-0 mt-0.5",
                    isStarred ? "text-amber-400" : "text-white/30 hover:text-amber-400"
                  )}
                  title={isStarred ? "Remove star" : "Star message"}
                >
                  <Star className="w-[18px] h-[18px]" weight={isStarred ? "fill" : "regular"} />
                </button>
              </div>

              {/* Messages Stack */}
              <div className="flex flex-col">
                {messages.length === 0 ? (
                  <p className="text-white/40 text-[13px] py-10 pl-[54px]">No messages in this thread.</p>
                ) : (
                  messages.map((m, i) => (
                    <MessageCard
                      key={m.id}
                      message={m}
                      isFirst={i === 0}
                      isLast={i === messages.length - 1}
                      onReply={() => setActiveReplyMode('reply')}
                      onReplyAll={() => handleReplyInComposer('reply_all')}
                      onForward={() => handleReplyInComposer('forward')}
                    />
                  ))
                )}
              </div>

              {/* Reply Bar */}
              <QuickReplyBar
                threadId={thread.id}
                smartReplyIdentityId={smartReplyIdentityId}
                activeMode={activeReplyMode}
                setActiveMode={setActiveReplyMode}
                onReplySent={loadThread}
                onExpandToFull={handleReplyInComposer}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}