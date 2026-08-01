'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Heart, MessageCircle, UserPlus, FolderPlus, Check, Trash2 } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const iconMap: Record<string, any> = {
  heart: Heart,
  message: MessageCircle,
  user: UserPlus,
  project: FolderPlus,
}

const colorMap: Record<string, string> = {
  like: 'text-pink-500 bg-pink-500/10',
  comment: 'text-blue-500 bg-blue-500/10',
  follow: 'text-purple-500 bg-purple-500/10',
  project_invitation: 'text-orange-500 bg-orange-500/10',
}

const filters = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'like', label: 'Likes' },
  { id: 'comment', label: 'Comments' },
  { id: 'follow', label: 'Follows' },
  { id: 'project_invitation', label: 'Invitations' },
]

export function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [filter, setFilter] = useState('all')

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.read
    return n.type === filter
  })

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount} unread
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
              filter === f.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/70'
            )}
          >
            {f.label}
            {f.id === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 text-[10px]">({unreadCount})</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border rounded-2xl p-16 text-center">
          <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h2 className="font-semibold">No notifications</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filter === 'all' 
              ? 'Activity from your projects and people you follow will appear here'
              : 'No notifications match this filter'
            }
          </p>
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden divide-y">
          {filtered.map(n => {
            const Icon = iconMap[n.icon || 'alert'] || Bell
            const colors = colorMap[n.type] || 'text-muted-foreground bg-muted'
            
            const content = (
              <div
                className={cn(
                  'p-4 flex gap-3 hover:bg-muted/40 transition-colors cursor-pointer',
                  !n.read && 'bg-blue-500/5'
                )}
                onClick={() => !n.read && markAsRead(n.id)}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  colors
                )}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium leading-snug">{n.title}</p>
                  {n.message && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {n.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-3" />
                )}
              </div>
            )

            return n.action_url ? (
              <Link key={n.id} href={n.action_url}>
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}