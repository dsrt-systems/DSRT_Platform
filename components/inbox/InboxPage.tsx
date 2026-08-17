'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Envelope, EnvelopeOpen, Check, X as XIcon, Circle,
  Buildings, FolderSimple, Certificate, Sparkle, UserPlus,
  Briefcase, Handshake, Archive as ArchiveIcon, MagnifyingGlass, User,
  PencilSimple, Star, Bell, Paperclip, ArrowsCounterClockwise,
  ChatCircle, DownloadSimple, File as FileIcon
} from '@phosphor-icons/react'
import { ComposeNewMessage } from './ComposeNewMessage'
import { ReplyComposer } from './ReplyComposer'

// ═══════════════════════════════════════════════════════════════
// CONFIG — Professional greyscale (semantic status colors kept below)
// ═══════════════════════════════════════════════════════════════

const TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  connection_request:      { icon: UserPlus,       label: 'Connection',    color: 'text-white/70' },
  role_application:        { icon: Briefcase,      label: 'Application',   color: 'text-white/70' },
  venture_connection:      { icon: Handshake,      label: 'Venture',       color: 'text-white/70' },
  looking_for_application: { icon: MagnifyingGlass, label: 'Looking For',  color: 'text-white/70' },
  collaboration_request:   { icon: UserPlus,       label: 'Collaboration', color: 'text-white/70' },
  dsrt_official:           { icon: Sparkle,        label: 'DSRT',          color: 'text-white/70' },
  system:                  { icon: Circle,         label: 'System',        color: 'text-white/60' },
  other:                   { icon: Envelope,       label: 'Message',       color: 'text-white/70' },
}

// Semantic status colors (Gmail-standard: unread=blue, accepted=green, declined=red)
const STATUS_STYLES: Record<string, string> = {
  unread:   'bg-blue-500/12 text-blue-300 border-blue-500/25',
  read:     'bg-white/[0.04] text-white/60 border-white/[0.08]',
  accepted: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/25',
  declined: 'bg-red-500/12 text-red-300 border-red-500/25',
  archived: 'bg-white/[0.03] text-white/45 border-white/[0.06]',
  pending:  'bg-yellow-500/12 text-yellow-300 border-yellow-500/25',
}

const FOLDERS = [
  { key: 'all',           label: 'All Mail',       icon: Envelope },
  { key: 'unread',        label: 'Unread',         icon: EnvelopeOpen },
  { key: 'starred',       label: 'Starred',        icon: Star },
  { key: 'applications',  label: 'Applications',   icon: Briefcase },
  { key: 'connections',   label: 'Connections',    icon: UserPlus },
  { key: 'notifications', label: 'Notifications',  icon: Bell },
  { key: 'sent',          label: 'Sent',           icon: ChatCircle },
  { key: 'archived',      label: 'Archived',       icon: ArchiveIcon },
]

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const diff = Math.floor((Date.now() - d.getTime()) / 60000)
  if (diff < 1) return 'now'
  if (diff < 60) return diff + 'm'
  const h = Math.floor(diff / 60)
  if (h < 24) return h + 'h'
  const days = Math.floor(h / 24)
  if (days < 7) return days + 'd'
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function InboxPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [folder, setFolder] = useState('all')
  const [searchQ, setSearchQ] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedThread, setSelectedThread] = useState<any[]>([])
  const [selectedMeta, setSelectedMeta] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({})
  const [composeOpen, setComposeOpen] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [responding, setResponding] = useState(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQ), 250)
    return () => clearTimeout(t)
  }, [searchQ])

  // ─── Fetch messages ───
  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ folder })
      if (debouncedSearch && debouncedSearch.length >= 2) params.append('q', debouncedSearch)
      const res = await fetch('/api/inbox?' + params)
      const json = await res.json()
      setMessages(json.messages || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [folder, debouncedSearch])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  // ─── Fetch folder counts ───
  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/inbox/count')
      const json = await res.json()
      setFolderCounts(json.folders || {})
    } catch {}
  }, [])

  useEffect(() => {
    fetchCounts()
    const iv = setInterval(fetchCounts, 15000)
    return () => clearInterval(iv)
  }, [fetchCounts])

  // ─── Load thread when selected ───
  useEffect(() => {
    if (!selectedId) { setSelectedThread([]); setSelectedMeta(null); return }
    setDetailLoading(true)
    fetch('/api/inbox/' + selectedId)
      .then(r => r.json())
      .then(j => {
        setSelectedThread(j.thread || [])
        setSelectedMeta({ message: j.message, sender: j.sender, threadId: j.threadId })

        // Mark all unread in thread as read
        const unreadInThread = (j.thread || []).filter((m: any) =>
          m.status === 'unread' && m.recipient_id === m.recipient_id
        )
        unreadInThread.forEach((m: any) => {
          fetch('/api/inbox/' + m.id + '/read', { method: 'POST' }).catch(() => {})
        })

        // Update local list
        setMessages(prev => prev.map(m =>
          m.thread_id === j.threadId || m.id === j.threadId
            ? { ...m, status: 'read' }
            : m
        ))
        fetchCounts()
      })
      .finally(() => setDetailLoading(false))
  }, [selectedId, fetchCounts])

  // ─── Actions ───
  const respond = async (messageId: string, action: 'accepted' | 'declined') => {
    setResponding(true)
    try {
      const res = await fetch('/api/inbox/' + messageId + '/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error()
      setSelectedThread(prev => prev.map(m => m.id === messageId ? { ...m, status: action } : m))
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: action } : m))
      fetchCounts()
    } catch { alert('Failed to respond') }
    finally { setResponding(false) }
  }

  const archiveMessage = async (id: string) => {
    try {
      await fetch('/api/inbox/' + id, { method: 'DELETE' })
      setMessages(prev => prev.filter(m => m.id !== id))
      if (selectedId === id) { setSelectedId(null) }
      fetchCounts()
    } catch {}
  }

  const toggleStar = async (id: string, current: boolean) => {
    try {
      await fetch('/api/inbox/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_starred: !current }),
      })
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_starred: !current } : m))
      setSelectedThread(prev => prev.map(m => m.id === id ? { ...m, is_starred: !current } : m))
    } catch {}
  }

  const markUnread = async (id: string) => {
    try {
      await fetch('/api/inbox/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'unread' }),
      })
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'unread' } : m))
      setSelectedThread(prev => prev.map(m => m.id === id ? { ...m, status: 'unread' } : m))
      fetchCounts()
    } catch {}
  }

  const onReplySent = () => {
    setReplyOpen(false)
    if (selectedId) {
      fetch('/api/inbox/' + selectedId)
        .then(r => r.json())
        .then(j => setSelectedThread(j.thread || []))
        .catch(() => {})
    }
    fetchMessages()
    fetchCounts()
  }

  const totalUnread = folderCounts.all || 0

  return (
    <div className="flex-1 min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-[1500px] mx-auto px-4 md:px-6 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight">
              Inbox
              {totalUnread > 0 && (
                <span className="ml-2 text-[13px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full align-middle">
                  {totalUnread}
                </span>
              )}
            </h1>
            <p className="text-[13px] text-white/50 mt-0.5">Your unified message center</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchMessages(); fetchCounts() }}
              className="w-9 h-9 rounded-md hover:bg-white/[0.06] text-white/60 hover:text-white flex items-center justify-center"
              title="Refresh"
            >
              <ArrowsCounterClockwise size={14} />
            </button>
            <button
              onClick={() => setComposeOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-white text-black hover:bg-zinc-200 text-[13px] font-bold"
            >
              <PencilSimple size={13} weight="bold" /> Compose
            </button>
          </div>
        </div>

        {/* Main grid: sidebar + list + detail */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_360px_1fr] border border-white/[0.06] rounded-xl overflow-hidden min-h-[720px]">

          {/* ── LEFT: Folder sidebar ── */}
          <div className="border-r border-white/[0.06] bg-white/[0.01] p-2 overflow-y-auto max-h-[80vh]">
            {FOLDERS.map(f => {
              const Icon = f.icon
              const active = folder === f.key
              const count = folderCounts[f.key] || 0
              return (
                <button
                  key={f.key}
                  onClick={() => { setFolder(f.key); setSelectedId(null) }}
                  className={
                    'w-full flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium transition-colors mb-0.5 ' +
                    (active
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/60 hover:bg-white/[0.04] hover:text-white')
                  }
                >
                  <Icon size={14} weight={active ? 'fill' : 'regular'} />
                  <span className="flex-1 text-left">{f.label}</span>
                  {count > 0 && f.key !== 'sent' && f.key !== 'archived' && (
                    <span className="text-[10px] font-bold bg-red-500/90 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* ── MIDDLE: Message list ── */}
          <div className="border-r border-white/[0.06] flex flex-col">
            {/* Search bar */}
            <div className="border-b border-white/[0.06] p-2">
              <div className="relative">
                <MagnifyingGlass size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search inbox..."
                  className="w-full h-8 pl-7 pr-3 rounded bg-white/[0.04] border border-white/[0.06] text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.15]"
                />
                {searchQ && (
                  <button
                    onClick={() => setSearchQ('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <XIcon size={10} />
                  </button>
                )}
              </div>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto max-h-[76vh]">
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-[72px] bg-white/[0.02] rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center">
                  <Envelope size={28} className="mx-auto mb-2 text-white/25" />
                  <p className="text-[13px] text-white/50 font-semibold">No messages</p>
                  <p className="text-[11px] text-white/35 mt-1">
                    {folder === 'sent' ? "You haven't sent any messages yet." :
                     folder === 'starred' ? 'Star messages to find them here.' :
                     folder === 'archived' ? 'Archived messages appear here.' :
                     'Your ' + folder + ' folder is empty.'}
                  </p>
                </div>
              ) : (
                messages.map(m => {
                  const cfg = TYPE_CONFIG[m.message_type] || TYPE_CONFIG.other
                  const Icon = cfg.icon
                  const isSelected = selectedId === m.id
                  const isUnread = m.status === 'unread'
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedId(m.id)}
                      className={
                        'flex items-start gap-2.5 px-3 py-3 cursor-pointer transition-colors border-b border-white/[0.04] ' +
                        (isSelected ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]') +
                        (isUnread ? ' border-l-2 border-l-blue-400' : '')
                      }
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {m.sender?.avatar_url ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-white/[0.06]">
                            <img src={m.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={'w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center ' + cfg.color}>
                            <Icon size={12} weight="fill" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className={'text-[12.5px] truncate ' + (isUnread ? 'font-bold text-white' : 'font-semibold text-white/85')}>
                            {m.sender?.full_name || 'DSRT System'}
                            {m.reply_count > 1 && (
                              <span className="ml-1 text-[10px] text-white/50 font-medium">({m.reply_count})</span>
                            )}
                          </p>
                          <span className="text-[10px] text-white/40 flex-shrink-0">{timeAgo(m.created_at)}</span>
                        </div>
                        <p className={'text-[11.5px] truncate ' + (isUnread ? 'text-white/85 font-medium' : 'text-white/60')}>
                          {m.subject || 'No subject'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={'text-[9px] font-semibold ' + cfg.color}>{cfg.label}</span>
                          {m.is_starred && <Star size={9} weight="fill" className="text-yellow-400" />}
                          {(m.attachments || []).length > 0 && <Paperclip size={9} className="text-white/40" />}
                          {m.reference_name && (
                            <span className="text-[9px] text-white/40 truncate">· {m.reference_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ── RIGHT: Detail pane (thread view) ── */}
          <div className="overflow-y-auto max-h-[80vh]">
            {!selectedId ? (
              <div className="flex items-center justify-center h-full text-center p-8 min-h-[500px]">
                <div>
                  <EnvelopeOpen size={40} className="mx-auto mb-3 text-white/20" />
                  <p className="text-[14px] text-white/50 font-semibold">Select a message</p>
                  <p className="text-[12px] text-white/35 mt-1">Click any message to view its thread</p>
                </div>
              </div>
            ) : detailLoading ? (
              <div className="p-6 text-center text-[13px] text-white/45">Loading...</div>
            ) : selectedThread.length > 0 ? (
              <div className="flex flex-col">
                {/* Thread header */}
                <div className="p-5 border-b border-white/[0.06] sticky top-0 bg-[#0a0a0f] z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[17px] font-bold text-white leading-tight">
                        {selectedMeta?.message?.subject || selectedThread[0]?.subject || 'No subject'}
                      </h2>
                      <p className="text-[11.5px] text-white/45 mt-1">
                        {selectedThread.length} message{selectedThread.length !== 1 ? 's' : ''} in this thread
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleStar(selectedThread[0].id, selectedThread[0].is_starred)}
                        className="w-8 h-8 rounded-md hover:bg-white/[0.06] text-white/50 hover:text-white flex items-center justify-center"
                        title="Star"
                      >
                        <Star size={14} weight={selectedThread[0].is_starred ? 'fill' : 'regular'}
                          className={selectedThread[0].is_starred ? 'text-yellow-400' : ''} />
                      </button>
                      <button
                        onClick={() => markUnread(selectedThread[0].id)}
                        className="w-8 h-8 rounded-md hover:bg-white/[0.06] text-white/50 hover:text-white flex items-center justify-center"
                        title="Mark unread"
                      >
                        <Envelope size={14} />
                      </button>
                      <button
                        onClick={() => archiveMessage(selectedThread[0].id)}
                        className="w-8 h-8 rounded-md hover:bg-white/[0.06] text-white/50 hover:text-white flex items-center justify-center"
                        title="Archive"
                      >
                        <ArchiveIcon size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Reference chip */}
                  {selectedMeta?.message?.reference_name && (
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1">
                      {selectedMeta.message.reference_type === 'venture' ? (
                        <Buildings size={12} className="text-white/60" />
                      ) : (
                        <FolderSimple size={12} className="text-white/60" />
                      )}
                      <span className="text-[12px] font-semibold text-white/85">{selectedMeta.message.reference_name}</span>
                      {selectedMeta.message.reference_slug && (
                        <Link
                          href={'/' + (selectedMeta.message.reference_type === 'venture' ? 'ventures' : 'projects') + '/' + selectedMeta.message.reference_slug}
                          className="text-[11px] text-white/80 hover:text-white font-medium"
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {/* Thread messages */}
                <div className="p-5 space-y-4">
                  {selectedThread.map((msg, i) => (
                    <ThreadMessageCard
                      key={msg.id}
                      message={msg}
                      isLast={i === selectedThread.length - 1}
                      onRespond={(action) => respond(msg.id, action)}
                      responding={responding}
                    />
                  ))}
                </div>

                {/* Reply button */}
                {!replyOpen && (
                  <div className="p-5 pt-0">
                    <button
                      onClick={() => setReplyOpen(true)}
                      className="w-full h-11 rounded-lg border border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.05] text-[13px] font-semibold text-white/80 hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <ChatCircle size={13} weight="regular" /> Reply
                    </button>
                  </div>
                )}

                {/* Reply composer */}
                {replyOpen && (
                  <ReplyComposer
                    messageId={selectedThread[selectedThread.length - 1].id}
                    onClose={() => setReplyOpen(false)}
                    onSent={onReplySent}
                  />
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-[13px] text-white/45">Message not found.</div>
            )}
          </div>
        </div>
      </div>

      {composeOpen && (
        <ComposeNewMessage
          onClose={() => setComposeOpen(false)}
          onSent={() => { setComposeOpen(false); fetchMessages(); fetchCounts() }}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// THREAD MESSAGE CARD
// ═══════════════════════════════════════════════════════════════

function ThreadMessageCard({ message, isLast, onRespond, responding }: {
  message: any
  isLast: boolean
  onRespond: (action: 'accepted' | 'declined') => void
  responding: boolean
}) {
  const [expanded, setExpanded] = useState(isLast)
  const sender = message.sender
  const attachments = message.attachments || []
  const canRespond = ['unread', 'read'].includes(message.status) &&
    ['connection_request', 'venture_connection', 'role_application', 'looking_for_application', 'collaboration_request'].includes(message.message_type)

  return (
    <div className={
      'rounded-xl border transition-colors ' +
      (expanded
        ? 'border-white/[0.1] bg-white/[0.02]'
        : 'border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.02] cursor-pointer')
    }>
      {/* Compact header (always visible) */}
      <div
        onClick={() => !expanded && setExpanded(true)}
        className="flex items-center gap-3 p-4"
      >
        <div className="w-9 h-9 rounded-full bg-white/[0.06] overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/[0.1]">
          {sender?.avatar_url ? (
            <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User size={14} className="text-white/50" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-bold text-white truncate">
              {sender?.full_name || 'Unknown'}
            </p>
            {sender?.is_verified && <Certificate size={11} weight="fill" className="text-blue-400" />}
          </div>
          {!expanded && (
            <p className="text-[11.5px] text-white/50 truncate mt-0.5">
              {(message.body || '').slice(0, 100)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {attachments.length > 0 && <Paperclip size={11} className="text-white/40" />}
          <span className="text-[10.5px] text-white/40">{timeAgo(message.created_at)}</span>
          {expanded && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(false) }}
              className="text-white/40 hover:text-white ml-1"
            >
              <XIcon size={11} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <>
          {/* Full timestamp */}
          <div className="px-4 pb-2 -mt-1">
            <p className="text-[11px] text-white/45">{fmtDate(message.created_at)}</p>
          </div>

          {/* Sender full card if expanded */}
          {sender && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 text-[11.5px] text-white/60">
                {sender.username && (
                  <Link
                    href={'/profile/' + sender.username}
                    className="text-white/70 hover:text-white underline"
                  >
                    @{sender.username}
                  </Link>
                )}
                {sender.tagline && <span className="truncate">· {sender.tagline}</span>}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="px-4 pb-4">
            <p className="text-[13.5px] text-white/90 leading-relaxed whitespace-pre-wrap">
              {message.body || 'No message content.'}
            </p>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="px-4 pb-4 border-t border-white/[0.06] pt-3">
              <p className="text-[10px] text-white/45 uppercase tracking-wider font-semibold mb-2">
                Attachments ({attachments.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((att: any, i: number) => (
                  <a
                    key={i}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                      <FileIcon size={13} className="text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-white truncate">{att.name}</p>
                      <p className="text-[10px] text-white/45">{fmtSize(att.size || 0)}</p>
                    </div>
                    <DownloadSimple size={12} className="text-white/40 group-hover:text-white flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Metadata links (for applications) */}
          {message.metadata && (
            message.metadata.portfolio_url ||
            message.metadata.github_url ||
            message.metadata.linkedin_url ||
            message.metadata.resume_url
          ) && (
            <div className="px-4 pb-4 border-t border-white/[0.06] pt-3">
              <p className="text-[10px] text-white/45 uppercase tracking-wider font-semibold mb-2">Links</p>
              <div className="flex flex-wrap gap-2">
                {message.metadata.portfolio_url && (
                  <a href={message.metadata.portfolio_url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-white/80 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] px-2.5 py-1 rounded transition-colors">
                    Portfolio ↗
                  </a>
                )}
                {message.metadata.github_url && (
                  <a href={message.metadata.github_url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-white/80 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] px-2.5 py-1 rounded transition-colors">
                    GitHub ↗
                  </a>
                )}
                {message.metadata.linkedin_url && (
                  <a href={message.metadata.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-white/80 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] px-2.5 py-1 rounded transition-colors">
                    LinkedIn ↗
                  </a>
                )}
                {message.metadata.resume_url && (
                  <a href={message.metadata.resume_url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-white/80 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] px-2.5 py-1 rounded transition-colors">
                    Resume ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {canRespond && isLast && (
            <div className="px-4 pb-4 flex items-center gap-2 border-t border-white/[0.06] pt-3">
              <button
                onClick={() => onRespond('declined')}
                disabled={responding}
                className="flex items-center gap-1.5 px-4 h-9 text-[13px] font-semibold text-red-300 bg-red-500/12 border border-red-500/25 hover:bg-red-500/20 rounded-md disabled:opacity-50"
              >
                <XIcon size={12} weight="bold" /> Decline
              </button>
              <div className="flex-1" />
              <button
                onClick={() => onRespond('accepted')}
                disabled={responding}
                className="flex items-center gap-1.5 px-5 h-9 text-[13px] font-bold bg-emerald-500 text-white hover:bg-emerald-400 rounded-md disabled:opacity-50"
              >
                <Check size={13} weight="bold" /> Accept
              </button>
            </div>
          )}

          {/* Already responded */}
          {['accepted', 'declined'].includes(message.status) && (
            <div className="px-4 pb-4">
              <div className={'p-2.5 rounded-lg border text-center text-[12px] font-semibold ' + (STATUS_STYLES[message.status] || '')}>
                {message.status === 'accepted' ? 'Accepted' : 'Declined'}
                {message.responded_at && (
                  <span className="text-white/40 font-normal">
                    {' '}· {new Date(message.responded_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}