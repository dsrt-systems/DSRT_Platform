'use client'

import Link from 'next/link'
import { Megaphone, Pin, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function AnnouncementBanner({ announcement }: { announcement: any }) {
  const priorityTone: Record<string, { border: string; bg: string; icon: any }> = {
    NORMAL: { border: 'border-white/[0.08]', bg: 'from-white/[0.03]', icon: Megaphone },
    IMPORTANT: { border: 'border-white/[0.14]', bg: 'from-white/[0.05]', icon: Megaphone },
    URGENT: { border: 'border-amber-500/25', bg: 'from-amber-500/[0.06]', icon: AlertTriangle },
  }
  const tone = priorityTone[announcement.priority] || priorityTone.NORMAL
  const Icon = tone.icon

  return (
    <article className={cn(
      'rounded-2xl border overflow-hidden bg-gradient-to-b to-white/[0.01]',
      tone.border,
      tone.bg
    )}>
      <div className="flex items-center gap-2 border-b border-white/[0.04] px-4 py-1.5 bg-white/[0.02]">
        <Icon className="w-3 h-3 text-white/60" strokeWidth={1.75} />
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-white/60">
          {announcement.priority === 'URGENT' ? 'Urgent announcement' : announcement.priority === 'IMPORTANT' ? 'Important' : 'Announcement'}
        </span>
        {announcement.pinned && (
          <span className="inline-flex items-center gap-1 ml-1 text-[10.5px] font-mono uppercase tracking-wider text-white/50">
            <Pin className="w-3 h-3" strokeWidth={1.75} /> Pinned
          </span>
        )}
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 border border-white/[0.06]">
            <AvatarImage src={announcement.author?.avatar_url ?? undefined} />
            <AvatarFallback className="text-[10px] bg-white/[0.06] text-white/80">
              {(announcement.author?.full_name || '?').charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[12px] text-white/70">
              <span className="font-semibold text-white">{announcement.author?.full_name || 'Admin'}</span>
              <span className="text-white/40"> · {formatDistanceToNow(new Date(announcement.published_at), { addSuffix: true })}</span>
            </p>
          </div>
        </div>
        <h3 className="text-[16px] font-semibold text-white leading-snug">{announcement.title}</h3>
        <p className="text-[13.5px] text-white/80 whitespace-pre-wrap leading-relaxed">{announcement.body}</p>
      </div>
    </article>
  )
}