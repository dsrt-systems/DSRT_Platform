'use client'

import { useState, useEffect } from 'react'
import {
  PaperPlaneRight, Paperclip, ArrowBendUpLeft, ArrowBendDoubleUpLeft, ArrowBendUpRight
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
  threadId: string
  smartReplyIdentityId: string | null
  activeMode: 'reply' | 'reply_all' | 'forward' | null
  setActiveMode: (mode: 'reply' | 'reply_all' | 'forward' | null) => void
  onReplySent: () => void
  onExpandToFull: (mode: 'reply' | 'reply_all' | 'forward') => void
}

export function QuickReplyBar({
  threadId,
  smartReplyIdentityId,
  activeMode,
  setActiveMode,
  onReplySent,
  onExpandToFull,
}: Props) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  // Clear draft when mode closes
  useEffect(() => {
    if (!activeMode) setBody('')
  }, [activeMode])

  const canSend = body.trim().length > 0 && !sending

  const handleSend = async () => {
    if (!canSend || !smartReplyIdentityId) return

    // Reply-all / forward with recipients should use full composer to prevent errors
    if (activeMode === 'reply_all' || activeMode === 'forward') {
      onExpandToFull(activeMode)
      return
    }

    setSending(true)
    try {
      const bodyHtml = body.split('\n').map((l) => `<p>${l || '<br/>'}</p>`).join('')

      const res = await fetch(`/api/mail/threads/${threadId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_identity_id: smartReplyIdentityId,
          body_html: bodyHtml,
          mode: activeMode || 'reply',
        }),
      })

      if (!res.ok) throw new Error('Failed to send')

      toast.success('Reply sent')
      setBody('')
      setActiveMode(null)
      onReplySent()
    } catch (e: any) {
      toast.error(e.message || 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  // ─── Default State: Gmail-style Pills ───
  if (!activeMode) {
    return (
      <div className="flex items-center gap-3 pt-6 pb-12 pl-2 sm:pl-[54px]">
        <button
          onClick={() => setActiveMode('reply')}
          className="flex items-center gap-2 h-9 px-5 rounded-full border border-white/[0.15] text-[13.5px] font-medium text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors"
        >
          <ArrowBendUpLeft className="w-4 h-4" />
          Reply
        </button>
        <button
          onClick={() => onExpandToFull('reply_all')}
          className="flex items-center gap-2 h-9 px-5 rounded-full border border-white/[0.15] text-[13.5px] font-medium text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors"
        >
          <ArrowBendDoubleUpLeft className="w-4 h-4" />
          Reply all
        </button>
        <button
          onClick={() => onExpandToFull('forward')}
          className="flex items-center gap-2 h-9 px-5 rounded-full border border-white/[0.15] text-[13.5px] font-medium text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors"
        >
          <ArrowBendUpRight className="w-4 h-4" />
          Forward
        </button>
      </div>
    )
  }

  // ─── Inline Reply Editor ───
  return (
    <div className="pt-6 pb-12 pl-2 sm:pl-[54px]">
      <div className="rounded-2xl border border-white/[0.15] bg-[#0a0a0f] overflow-hidden focus-within:border-white/[0.3] transition-colors shadow-lg">
        
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSend) {
              e.preventDefault()
              handleSend()
            }
          }}
          autoFocus
          placeholder="Write your reply..."
          className="w-full min-h-[140px] p-5 bg-transparent text-[14px] text-white/90 placeholder:text-white/40 focus:outline-none resize-y font-sans leading-relaxed"
        />

        <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-t border-white/[0.08]">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                'flex items-center gap-2 h-9 px-5 rounded-full font-semibold text-[13px] transition-all',
                'bg-blue-600 hover:bg-blue-500 text-white shadow-md',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {sending ? 'Sending...' : 'Send'}
              {!sending && <PaperPlaneRight className="w-3.5 h-3.5" weight="fill" />}
            </button>
            <button
              onClick={() => onExpandToFull(activeMode)}
              title="Attach files (Open full composer)"
              className="w-9 h-9 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => { setActiveMode(null); setBody('') }}
            className="text-[13px] font-medium text-white/50 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/[0.05] transition-colors"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  )
}