'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { 
  User, Rocket, Buildings, DotsThreeVertical, CheckCircle, 
  ArrowBendUpLeft, Printer, Warning, CaretDown, CaretUp
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AttachmentPreview } from './AttachmentPreview'

interface Props {
  message: any
  isLast: boolean
  isFirst: boolean
  onReply: () => void
  onReplyAll: () => void
  onForward: () => void
}

const ENTITY_META = {
  user: { icon: User, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  venture: { icon: Buildings, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  project: { icon: Rocket, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
}

function formatFullDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  if (isToday) return timeStr
  return d.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

export function MessageCard({ message, isLast, onReply, onReplyAll, onForward }: Props) {
  // Auto-collapse older messages, expand the latest one
  const [expanded, setExpanded] = useState(isLast)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const sender = message.sender_identity
  const entityType = (sender?.entity_type as keyof typeof ENTITY_META) || 'user'
  const meta = ENTITY_META[entityType] || ENTITY_META.user
  const Icon = meta.icon

  const attachments = Array.isArray(message.attachments) ? message.attachments : []

  const bodyHtmlContent = useMemo(() => {
    if (message.body_html?.trim()) return message.body_html
    const rawText = message.body_text || message.body || ''
    if (!rawText.trim()) return '<p class="text-white/40 italic">(No message content)</p>'
    return rawText.split(/\n\n+/).map((p: string) => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('')
  }, [message.body_html, message.body_text, message.body])

  const preview = useMemo(() => {
    const text = (message.body_text || message.body_html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    return text.slice(0, 100) + (text.length > 100 ? '...' : '')
  }, [message.body_text, message.body_html])

  return (
    <div className={cn(
      "group relative border-b border-white/[0.04] last:border-0",
      expanded ? "py-4" : "py-2.5 cursor-pointer hover:bg-white/[0.01]"
    )}>
      {/* Header Row */}
      <div 
        className="flex items-start gap-3.5 px-2"
        onClick={() => !expanded && setExpanded(true)}
      >
        <div className="w-10 h-10 rounded-full overflow-hidden bg-white/[0.05] border border-white/[0.08] flex-shrink-0 flex items-center justify-center mt-0.5">
          {sender?.avatar_url ? (
            <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Icon className="w-5 h-5 text-white/50" weight="fill" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            
            {/* Sender Info */}
            <div className="flex items-baseline gap-2 truncate">
              <span className="text-[14.5px] font-semibold text-white/95 truncate">
                {sender?.display_name || message.sender_email || 'Unknown Sender'}
              </span>
              {sender?.is_verified && <CheckCircle className="w-3.5 h-3.5 text-blue-400 translate-y-0.5" weight="fill" />}
              <span className="text-[12px] text-white/40 truncate hidden sm:inline">
                &lt;{sender?.dsrt_email || message.sender_email}&gt;
              </span>
            </div>

            {/* Date & Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-[11.5px] text-white/45 whitespace-nowrap">
                {formatFullDate(message.sent_at)}
              </span>

              {/* Top Right Quick Actions (Only visible on hover when expanded) */}
              {expanded && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={onReply} className="w-8 h-8 rounded-full hover:bg-white/[0.08] text-white/50 hover:text-white flex items-center justify-center transition-colors" title="Reply">
                    <ArrowBendUpLeft className="w-4 h-4" />
                  </button>
                  <div ref={menuRef} className="relative">
                    <button onClick={() => setMenuOpen(!menuOpen)} className="w-8 h-8 rounded-full hover:bg-white/[0.08] text-white/50 hover:text-white flex items-center justify-center transition-colors" title="More">
                      <DotsThreeVertical className="w-4 h-4" weight="bold" />
                    </button>
                    {menuOpen && (
                      <div className="absolute top-full right-0 mt-1 w-40 z-50 rounded-xl bg-[#1a1a24] border border-white/[0.1] shadow-2xl overflow-hidden py-1">
                        <button onClick={() => { onReplyAll(); setMenuOpen(false) }} className="w-full text-left px-4 py-2 text-[13px] text-white/80 hover:bg-white/[0.06] hover:text-white">Reply all</button>
                        <button onClick={() => { onForward(); setMenuOpen(false) }} className="w-full text-left px-4 py-2 text-[13px] text-white/80 hover:bg-white/[0.06] hover:text-white">Forward</button>
                        <div className="h-px bg-white/[0.08] my-1" />
                        <button onClick={() => { window.print(); setMenuOpen(false) }} className="w-full flex items-center gap-2 px-4 py-2 text-[13px] text-white/80 hover:bg-white/[0.06] hover:text-white">
                          <Printer className="w-4 h-4" /> Print
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Collapsed Preview */}
          {!expanded && (
            <p className="text-[13px] text-white/50 truncate pr-12">
              {preview}
            </p>
          )}
        </div>
      </div>

      {/* Expanded Body */}
      {expanded && (
        <div className="pl-2 sm:pl-[54px] pr-2 pt-2 pb-1">
          <div
            className={cn(
              "text-[14px] text-white/85 font-normal leading-[1.6] select-text break-words",
              "prose prose-invert max-w-none",
              "prose-p:my-2 prose-a:text-violet-400 prose-a:underline hover:prose-a:text-violet-300",
              "prose-blockquote:border-l-2 prose-blockquote:border-white/20 prose-blockquote:pl-4 prose-blockquote:text-white/60",
            )}
            dangerouslySetInnerHTML={{ __html: bodyHtmlContent }}
          />

          {attachments.length > 0 && (
            <div className="mt-5">
              <AttachmentPreview attachments={attachments} />
            </div>
          )}
        </div>
      )}

      {/* Expand/Collapse Toggle (if not the only message) */}
      {expanded && !isLast && (
        <div className="pl-[54px] pt-4">
          <button 
            onClick={() => setExpanded(false)}
            className="text-[11px] font-medium text-white/30 hover:text-white/60 uppercase tracking-wider"
          >
            Collapse message
          </button>
        </div>
      )}
    </div>
  )
}