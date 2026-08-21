'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Envelope, ArrowClockwise, CheckSquare, Square, Archive, 
  Trash, EnvelopeOpen, X, DotsThree, CaretLeft, CaretRight,
  Warning
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { ThreadRow } from './ThreadRow'
import { useMailIdentity, useOnIdentityChange } from './hooks/useMailIdentity'
import { MailTab } from './MailTabs'
import { MailFilters } from './AdvancedFilterBar'

interface Props {
  activeFolder: string
  activeTab: MailTab
  searchQ: string
  filters: MailFilters
  selectedThreadId: string | null
  onSelectThread: (id: string) => void
}

const PAGE_SIZE = 50

const FOLDER_META: Record<string, { title: string; emptyTitle: string; emptyDesc: string }> = {
  inbox: { title: 'Inbox', emptyTitle: 'Inbox zero', emptyDesc: 'No new messages here.' },
  starred: { title: 'Starred', emptyTitle: 'No starred messages', emptyDesc: 'Star important messages to find them here.' },
  snoozed: { title: 'Snoozed', emptyTitle: 'Nothing snoozed', emptyDesc: 'Snoozed messages will return to your inbox.' },
  sent: { title: 'Sent', emptyTitle: 'No sent messages', emptyDesc: 'Messages you send will appear here.' },
  drafts: { title: 'Drafts', emptyTitle: 'No drafts', emptyDesc: 'Unfinished messages are saved automatically.' },
  scheduled: { title: 'Scheduled', emptyTitle: 'Nothing scheduled', emptyDesc: 'Compose a message and choose a future time.' },
  all: { title: 'All Mail', emptyTitle: 'No mail yet', emptyDesc: 'Your messages will appear here.' },
  spam: { title: 'Spam', emptyTitle: 'No spam', emptyDesc: 'Suspicious messages are filtered here.' },
  trash: { title: 'Trash', emptyTitle: 'Trash is empty', emptyDesc: 'Deleted messages appear here.' },
  important: { title: 'Important', emptyTitle: 'Nothing marked important', emptyDesc: 'Priority messages will appear here.' },
  action_required: { title: 'Action Required', emptyTitle: 'All caught up', emptyDesc: 'No pending actions right now.' },
  awaiting_reply: { title: 'Awaiting Reply', emptyTitle: 'No pending replies', emptyDesc: 'Messages you sent awaiting response.' },
  unread: { title: 'Unread', emptyTitle: 'All read', emptyDesc: 'You have no unread messages.' },
  with_attachments: { title: 'With Attachments', emptyTitle: 'No attachments', emptyDesc: 'Messages with files will appear here.' },
  shared_with_me: { title: 'Shared With Me', emptyTitle: 'Nothing shared', emptyDesc: 'Messages sent to you will appear here.' },
}

export function ThreadList({ 
  activeFolder, activeTab, searchQ, filters, 
  selectedThreadId, onSelectThread 
}: Props) {
  const router = useRouter()
  const { activeIdentity, isUnified } = useMailIdentity()
  const [threads, setThreads] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const abortRef = useRef<AbortController | null>(null)

  // Reset page when filters/folder/tab/search change
  useEffect(() => {
    setPage(0)
    setChecked(new Set())
  }, [activeFolder, activeTab, searchQ, JSON.stringify(filters)])

  const fetchThreads = useCallback(async (isRefresh = false) => {
    if (!activeIdentity) return
    
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const identityId = isUnified 
        ? 'unified' 
        : (typeof activeIdentity === 'object' ? activeIdentity.identity_id : '')
      const params = new URLSearchParams({ 
        identity_id: identityId, 
        folder: activeFolder,
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      })
      if (activeTab) params.append('tab', activeTab)
      if (searchQ) params.append('q', searchQ)
      if (filters.hasAttachment) params.append('has_attachment', '1')
      if (filters.isUnread) params.append('unread_only', '1')
      if (filters.isStarred) params.append('starred_only', '1')
      if (filters.fromType !== 'all') params.append('from_type', filters.fromType)
      if (filters.dateRange !== 'all') params.append('date_range', filters.dateRange)

      const res = await fetch(`/api/mail/threads?${params}`, {
        signal: abortRef.current.signal,
        cache: 'no-store',
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to load')

      setThreads(data.threads || [])
      setTotal(data.total || 0)
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error(e)
        setError(e.message || 'Failed to load mail')
        toast.error('Failed to load mail')
      }
    } finally { 
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeIdentity, isUnified, activeFolder, activeTab, searchQ, filters, page])

  useEffect(() => { 
    fetchThreads() 
  }, [fetchThreads])

  // React to identity change
  useOnIdentityChange(() => {
    setChecked(new Set())
    setPage(0)
  })

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`mail_threads_${activeFolder}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'mail_messages' }, 
        () => fetchThreads(true)
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'mail_thread_participants' }, 
        () => fetchThreads(true)
      )
      .subscribe()

    const refresh = () => fetchThreads(true)
    window.addEventListener('mail:refresh', refresh)

    return () => { 
      supabase.removeChannel(channel)
      window.removeEventListener('mail:refresh', refresh)
    }
  }, [supabase, fetchThreads, activeFolder])

  // Bulk actions
  const handleBulkAction = async (updates: any, msg: string) => {
    if (checked.size === 0) return
    const ids = Array.from(checked)
    setThreads(prev => prev.filter(t => !ids.includes(t.id)))
    setChecked(new Set())
    try {
      const res = await fetch('/api/mail/threads/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_ids: ids, updates }),
      })
      if (!res.ok) throw new Error()
      toast.success(msg)
      window.dispatchEvent(new Event('mail:refresh'))
      window.dispatchEvent(new Event('mail:counts:refresh'))
    } catch {
      toast.error('Action failed')
      fetchThreads()
    }
  }

  const handleStar = async (threadId: string, starred: boolean) => {
    setThreads(prev => prev.map(t => 
      t.id === threadId 
        ? { ...t, participant_state: { ...t.participant_state, is_starred: starred } } 
        : t
    ))
    try {
      await fetch(`/api/mail/threads/${threadId}/state`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ is_starred: starred }) 
      })
    } catch {
      fetchThreads()
    }
  }

  // Handle Thread Click - Navigate to full page or open draft
  const handleThreadClick = async (thread: any) => {
    if (activeFolder === 'drafts' || activeFolder === 'scheduled' || thread.is_draft || thread.is_scheduled) {
      toast.loading('Loading draft...', { id: 'draft-load' })
      try {
        const res = await fetch(`/api/mail/drafts/${thread.id}/detail`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load draft')
        
        // Dispatch event so MailPage opens the composer with draft data
        window.dispatchEvent(new CustomEvent('mail:open_draft', { detail: data.draft }))
        toast.dismiss('draft-load')
      } catch (err: any) {
        toast.error(err.message || 'Failed to load draft', { id: 'draft-load' })
      }
    } else {
      // Navigate to the full-page thread view!
      router.push(`/inbox/${thread.id}`)
    }
  }

  const toggleCheck = (threadId: string, isChecked: boolean) => {
    setChecked(prev => { 
      const next = new Set(prev)
      if (isChecked) next.add(threadId)
      else next.delete(threadId)
      return next 
    })
  }
  
  const toggleSelectAll = () => {
    if (checked.size === threads.length) setChecked(new Set())
    else setChecked(new Set(threads.map(t => t.id)))
  }

  const unreadCount = threads.filter(t => !t.participant_state?.is_read).length
  const meta = FOLDER_META[activeFolder] || FOLDER_META.inbox
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const startIdx = page * PAGE_SIZE + 1
  const endIdx = Math.min((page + 1) * PAGE_SIZE, total)

  return (
    <section className="flex-1 w-full bg-[#0a0a0f] flex flex-col min-h-0">
      {/* HEADER */}
      {checked.size > 0 ? (
        <div className="h-11 border-b border-white/[0.06] bg-white/[0.04] flex items-center justify-between px-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setChecked(new Set())} 
              className="text-white/70 hover:text-white"
              title="Deselect all"
            >
              <X className="w-3.5 h-3.5" weight="bold" />
            </button>
            <span className="text-[11.5px] font-bold text-white">
              {checked.size} selected
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button 
              onClick={() => handleBulkAction({ is_archived: true }, 'Archived')} 
              className="w-7 h-7 rounded hover:bg-white/[0.08] text-white/70 hover:text-white flex items-center justify-center" 
              title="Archive (E)"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => handleBulkAction({ is_trashed: true }, 'Moved to trash')} 
              className="w-7 h-7 rounded hover:bg-red-500/15 text-white/70 hover:text-red-400 flex items-center justify-center" 
              title="Move to trash (#)"
            >
              <Trash className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-white/[0.1] mx-1" />
            <button 
              onClick={() => handleBulkAction({ is_read: true }, 'Marked as read')} 
              className="w-7 h-7 rounded hover:bg-white/[0.08] text-white/70 hover:text-white flex items-center justify-center" 
              title="Mark as read"
            >
              <EnvelopeOpen className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => handleBulkAction({ is_read: false }, 'Marked as unread')} 
              className="w-7 h-7 rounded hover:bg-white/[0.08] text-white/70 hover:text-white flex items-center justify-center" 
              title="Mark as unread"
            >
              <Envelope className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="h-11 border-b border-white/[0.06] flex items-center justify-between px-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleSelectAll} 
              className="w-7 h-7 rounded hover:bg-white/[0.06] text-white/40 hover:text-white flex items-center justify-center transition-colors"
              title="Select all"
            >
              {threads.length > 0 && checked.size === threads.length 
                ? <CheckSquare className="w-3.5 h-3.5 text-white" weight="fill" />
                : <Square className="w-3.5 h-3.5" />
              }
            </button>
            <div className="flex flex-col leading-tight">
              <p className="text-[12.5px] font-bold text-white">{meta.title}</p>
              {unreadCount > 0 && (
                <span className="text-[10px] text-white/50 font-medium">
                  {unreadCount} unread
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            {/* Pagination info + controls */}
            {total > 0 && (
              <div className="flex items-center gap-1 mr-2">
                <span className="text-[10.5px] text-white/50 font-medium">
                  {startIdx}–{endIdx} of {total}
                </span>
                <button 
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-6 h-6 rounded hover:bg-white/[0.06] text-white/50 hover:text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <CaretLeft className="w-3 h-3" weight="bold" />
                </button>
                <button 
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1}
                  className="w-6 h-6 rounded hover:bg-white/[0.06] text-white/50 hover:text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <CaretRight className="w-3 h-3" weight="bold" />
                </button>
              </div>
            )}
            <button 
              onClick={() => fetchThreads(true)} 
              disabled={refreshing}
              className={cn(
                "w-7 h-7 rounded hover:bg-white/[0.06] text-white/40 hover:text-white flex items-center justify-center transition-colors",
                refreshing && "text-white/70"
              )}
              title="Refresh"
            >
              <ArrowClockwise className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
            </button>
            <button 
              className="w-7 h-7 rounded hover:bg-white/[0.06] text-white/40 hover:text-white flex items-center justify-center transition-colors"
              title="More"
            >
              <DotsThree className="w-4 h-4" weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* THREAD LIST */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div 
                key={i} 
                className="h-[72px] rounded-lg bg-gradient-to-r from-white/[0.02] via-white/[0.03] to-white/[0.02] animate-pulse" 
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-red-500/[0.06] border border-red-500/20 flex items-center justify-center mb-3">
              <Warning className="w-6 h-6 text-red-400" weight="duotone" />
            </div>
            <p className="text-[13px] font-bold text-white mb-1">Something went wrong</p>
            <p className="text-[11px] text-white/45 mb-3">{error}</p>
            <button
              onClick={() => fetchThreads()}
              className="text-[11.5px] font-semibold text-white/70 hover:text-white px-3 py-1.5 rounded bg-white/[0.06] hover:bg-white/[0.1]"
            >
              Try again
            </button>
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-3">
              <Envelope className="w-6 h-6 text-white/25" weight="duotone" />
            </div>
            <p className="text-[13px] font-bold text-white mb-1">
              {searchQ ? 'No results found' : meta.emptyTitle}
            </p>
            <p className="text-[11px] text-white/45 max-w-[240px]">
              {searchQ ? `No messages match "${searchQ}"` : meta.emptyDesc}
            </p>
          </div>
        ) : (
          <div>
            {threads.map(t => (
              <ThreadRow
                key={t.id}
                thread={t}
                isSelected={selectedThreadId === t.id}
                isChecked={checked.has(t.id)}
                onClick={() => handleThreadClick(t)}
                onCheck={(c) => toggleCheck(t.id, c)}
                onStar={(s) => handleStar(t.id, s)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}