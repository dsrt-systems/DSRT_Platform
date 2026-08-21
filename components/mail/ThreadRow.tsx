'use client'

import { Star, Paperclip, User, Rocket, Buildings } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useMailIdentity } from './hooks/useMailIdentity'

interface Props {
  thread: any
  isSelected: boolean
  isChecked: boolean
  onClick: () => void
  onCheck: (checked: boolean) => void
  onStar: (starred: boolean) => void
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })
}

const ENTITY_ICON = { user: User, venture: Buildings, project: Rocket }

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  connect: { label: 'Connect', color: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
  application: { label: 'Application', color: 'bg-violet-500/10 text-violet-300 border-violet-500/20' },
  venture_invite: { label: 'Venture', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  project_invite: { label: 'Project', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  draft: { label: 'Draft', color: 'bg-white/[0.06] text-white/50 border-white/[0.1]' },
  scheduled: { label: 'Scheduled', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
}

export function ThreadRow({ 
  thread, isSelected, isChecked, 
  onClick, onStar, onCheck 
}: Props) {
  const { isUnified } = useMailIdentity()
  const isUnread = !thread.participant_state?.is_read
  const isStarred = thread.participant_state?.is_starred
  const sender = thread.last_sender_identity
  const receiving = thread.receiving_identity
  const SenderIcon = sender ? (ENTITY_ICON[sender.entity_type as keyof typeof ENTITY_ICON] || User) : User
  const sourceMeta = thread.source_type ? SOURCE_LABELS[thread.source_type] : null

  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-white/[0.03] relative",
        isSelected 
          ? "bg-white/[0.06]" 
          : "hover:bg-white/[0.02]",
        isUnread && !isSelected && "bg-white/[0.015]"
      )}
    >
      {/* Selection indicator (left blue bar) */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white" />
      )}

      {/* Checkbox + Star column */}
      <div className="flex flex-col items-center gap-2 pt-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); onCheck(!isChecked) }}
          className={cn(
            "w-4 h-4 rounded border transition-colors flex items-center justify-center",
            isChecked 
              ? "bg-white border-white" 
              : "border-white/20 hover:border-white/50"
          )}
        >
          {isChecked && <div className="w-2 h-2 bg-black rounded-sm" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onStar(!isStarred) }}
          className={cn(
            "transition-colors",
            isStarred ? "text-amber-400" : "text-white/20 hover:text-amber-400/60"
          )}
        >
          <Star className="w-3.5 h-3.5" weight={isStarred ? "fill" : "regular"} />
        </button>
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/[0.04] border border-white/[0.06] flex-shrink-0 flex items-center justify-center">
        {sender?.avatar_url ? (
          <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <SenderIcon className="w-4 h-4 text-white/50" weight="fill" />
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Line 1: Sender + Time */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />}
            <p className={cn(
              "text-[13px] truncate",
              isUnread ? "font-bold text-white" : "font-semibold text-white/75"
            )}>
              {sender?.display_name || 'Unknown'}
            </p>
            {thread.message_count > 1 && (
              <span className="text-[10.5px] text-white/35 flex-shrink-0 font-medium">
                {thread.message_count}
              </span>
            )}
          </div>
          <span className={cn(
            "text-[10.5px] flex-shrink-0",
            isUnread ? "text-white/70 font-semibold" : "text-white/40"
          )}>
            {formatTime(thread.last_message_at)}
          </span>
        </div>

        {/* Line 2: Subject */}
        <p className={cn(
          "text-[12.5px] truncate mb-0.5",
          isUnread ? "font-semibold text-white/95" : "text-white/60"
        )}>
          {thread.subject || '(no subject)'}
        </p>

        {/* Line 3: Preview */}
        <p className="text-[11px] text-white/40 truncate leading-normal">
          {thread.last_message_preview || 'No preview available'}
        </p>

        {/* Line 4: Meta chips (source, attachment, receiving identity in unified) */}
        {(sourceMeta || thread.has_attachments || (isUnified && receiving)) && (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {sourceMeta && (
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                sourceMeta.color
              )}>
                {sourceMeta.label}
              </span>
            )}
            {thread.has_attachments && (
              <div className="flex items-center gap-1 text-white/40">
                <Paperclip className="w-3 h-3" />
                {thread.attachments_count > 0 && (
                  <span className="text-[9.5px] font-semibold">{thread.attachments_count}</span>
                )}
              </div>
            )}
            {isUnified && receiving && (
              <div className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.05]">
                <span className="text-[9px] text-white/50 font-semibold truncate max-w-[100px]">
                  → {receiving.display_name}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}