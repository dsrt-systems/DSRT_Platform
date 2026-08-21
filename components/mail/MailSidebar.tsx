'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Envelope, Star, Clock, PaperPlaneRight, FileText, CalendarBlank,
  Trash, Warning, PencilSimple, Bell, Files, Users, Handshake
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useMailIdentity, useOnIdentityChange } from './hooks/useMailIdentity'

interface Props {
  activeFolder: string
  onFolderChange: (folder: string) => void
  onComposeClick: () => void
}

const MAIN_FOLDERS = [
  { key: 'inbox', label: 'Inbox', icon: Envelope, countKey: 'inbox', showBadge: true },
  { key: 'starred', label: 'Starred', icon: Star, countKey: 'starred', showBadge: true },
  { key: 'snoozed', label: 'Snoozed', icon: Clock, countKey: 'snoozed', showBadge: true },
  { key: 'sent', label: 'Sent', icon: PaperPlaneRight, countKey: 'sent', showBadge: false },
  { key: 'drafts', label: 'Drafts', icon: FileText, countKey: 'drafts', showBadge: false, showCount: true },
  { key: 'scheduled', label: 'Scheduled', icon: CalendarBlank, countKey: 'scheduled', showBadge: false, showCount: true },
  { key: 'all', label: 'All Mail', icon: Files, countKey: 'all', showBadge: false },
  { key: 'spam', label: 'Spam', icon: Warning, countKey: 'spam', showBadge: true },
  { key: 'trash', label: 'Trash', icon: Trash, countKey: 'trash', showBadge: false },
]

const SMART_VIEWS = [
  { key: 'important', label: 'Important', icon: Bell, countKey: 'important', showBadge: true },
  { key: 'action_required', label: 'Action Required', icon: Handshake, countKey: 'action_required', showBadge: true },
  { key: 'awaiting_reply', label: 'Awaiting Reply', icon: Clock, countKey: 'awaiting_reply', showBadge: true },
  { key: 'unread', label: 'Unread', icon: Envelope, countKey: 'unread', showBadge: true },
  { key: 'with_attachments', label: 'With Attachments', icon: Files, countKey: 'with_attachments', showBadge: false, showCount: true },
  { key: 'shared_with_me', label: 'Shared With Me', icon: Users, countKey: 'shared_with_me', showBadge: true },
]

export function MailSidebar({ activeFolder, onFolderChange, onComposeClick }: Props) {
  const { activeIdentity, isUnified } = useMailIdentity()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const supabase = createClient()

  const fetchCounts = useCallback(async () => {
    const identityId = isUnified 
      ? 'unified' 
      : (typeof activeIdentity === 'object' && activeIdentity !== null 
          ? activeIdentity.identity_id 
          : '')
    if (!identityId) return

    try {
      const res = await fetch(`/api/mail/counts?identity_id=${identityId}`, {
        cache: 'no-store'
      })
      const d = await res.json()
      setCounts(d.counts || {})
    } catch (e) {
      console.error('Count fetch error:', e)
    }
  }, [activeIdentity, isUnified])

  useEffect(() => {
    fetchCounts()
  }, [fetchCounts])

  useOnIdentityChange(() => {
    fetchCounts()
  })

  useEffect(() => {
    const channel = supabase
      .channel('mail_sidebar_counts')
      .on('postgres_changes', { 
        event: '*', schema: 'public', table: 'mail_thread_participants' 
      }, () => fetchCounts())
      .on('postgres_changes', { 
        event: '*', schema: 'public', table: 'mail_messages' 
      }, () => fetchCounts())
      .subscribe()

    const refresh = () => fetchCounts()
    window.addEventListener('mail:refresh', refresh)
    window.addEventListener('mail:counts:refresh', refresh)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('mail:refresh', refresh)
      window.removeEventListener('mail:counts:refresh', refresh)
    }
  }, [fetchCounts, supabase])

  const renderItem = (item: any) => {
    const Icon = item.icon
    const active = activeFolder === item.key
    const count = item.countKey ? counts[item.countKey] || 0 : 0
    const showBadge = item.showBadge && count > 0
    const showCount = item.showCount && count > 0

    return (
      <button
        key={item.key}
        onClick={() => onFolderChange(item.key)}
        className={cn(
          "w-full flex items-center gap-3 pl-3 pr-2.5 h-8 rounded-md text-[12.5px] font-medium transition-all group relative",
          active
            ? "bg-white/[0.09] text-white"
            : "text-white/55 hover:bg-white/[0.04] hover:text-white/90"
        )}
      >
        {active && (
          <div className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-white rounded-r" />
        )}
        <Icon 
          className={cn(
            "w-4 h-4 flex-shrink-0", 
            active ? "text-white" : "text-white/40 group-hover:text-white/70"
          )} 
          weight={active ? "fill" : "regular"} 
        />
        <span className="flex-1 truncate text-left">{item.label}</span>
        {showBadge && (
          <span className={cn(
            "text-[10px] font-bold px-1.5 h-4 min-w-[16px] flex items-center justify-center rounded",
            active ? "bg-white text-black" : "bg-white/[0.08] text-white/75"
          )}>
            {count > 99 ? '99+' : count}
          </span>
        )}
        {showCount && (
          <span className={cn(
            "text-[10.5px] font-medium",
            active ? "text-white/70" : "text-white/40"
          )}>
            {count}
          </span>
        )}
      </button>
    )
  }

  return (
    <aside className="w-[224px] flex-shrink-0 bg-[#08080c] flex flex-col overflow-y-auto scrollbar-hide">
      <div className="p-3 space-y-3">
        <button
          onClick={onComposeClick}
          className={cn(
            "w-full flex items-center justify-center gap-2 h-10 rounded-xl transition-all",
            "bg-white text-black hover:bg-zinc-100",
            "font-bold text-[13px] tracking-tight",
            "shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_2px_8px_rgba(0,0,0,0.4)]"
          )}
        >
          <PencilSimple className="w-4 h-4" weight="bold" />
          Compose
        </button>

        <div className={cn(
          "rounded-xl p-2",
          "bg-gradient-to-b from-white/[0.035] to-white/[0.015]",
          "border border-white/[0.06]"
        )}>
          <p className="text-[9px] uppercase tracking-[0.12em] font-bold text-white/40 px-2.5 py-1.5">
            Mail
          </p>
          <nav className="space-y-[1px]">
            {MAIN_FOLDERS.map(renderItem)}
          </nav>
        </div>

        <div className={cn(
          "rounded-xl p-2",
          "bg-gradient-to-b from-white/[0.035] to-white/[0.015]",
          "border border-white/[0.06]"
        )}>
          <p className="text-[9px] uppercase tracking-[0.12em] font-bold text-white/40 px-2.5 py-1.5">
            Smart Views
          </p>
          <nav className="space-y-[1px]">
            {SMART_VIEWS.map(renderItem)}
          </nav>
        </div>

        <div className="px-3 pt-1">
          <p className="text-[9.5px] text-white/25 leading-relaxed">
            DSRT Mail unifies communication for people, projects and ventures.
          </p>
        </div>
      </div>
    </aside>
  )
}