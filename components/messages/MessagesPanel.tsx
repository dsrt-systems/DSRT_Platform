'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageCircle,
  Search,
  Edit,
  Minus,
  Maximize2,
  X,
  MoreHorizontal,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface MessagesPanelProps {
  user: any
}

export function MessagesPanel({ user }: MessagesPanelProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)

  // Mock conversations for now (replace with real data from supabase later)
  const conversations: any[] = []

  const handleExpand = () => {
    router.push('/messages')
  }

  return (
    <>
      {/* Floating toggle button (when panel is closed) */}
      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true)
            setMinimized(false)
          }}
          className="fixed bottom-4 right-4 lg:right-[336px] z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      )}

      {/* Floating panel */}
      {open && (
        <div
          className={cn(
            'fixed right-4 lg:right-[336px] z-40 rounded-t-2xl border border-border bg-background shadow-2xl flex flex-col transition-all',
            minimized
              ? 'bottom-0 h-12 w-72'
              : 'bottom-0 h-[500px] w-80'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="w-7 h-7">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="text-[10px]">
                  {user.full_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm">Messaging</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => router.push('/messages/new')}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                title="New message"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleExpand}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Expand"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMinimized(!minimized)}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Minimize"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body */}
          {!minimized && (
            <>
              {/* Search */}
              <div className="px-3 py-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search messages"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-muted/40 border-0 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center border-b border-border">
                <button
                  type="button"
                  className="flex-1 py-2 text-xs font-semibold border-b-2 border-primary text-foreground"
                >
                  Focused
                </button>
                <button
                  type="button"
                  className="flex-1 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Other
                </button>
              </div>

              {/* Conversation list */}
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8">
                    <MessageCircle className="w-10 h-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium">No messages yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Start a conversation with builders, founders, or
                      collaborators.
                    </p>
                  </div>
                ) : (
                  conversations.map((conv: any) => (
                    <button
                      key={conv.id}
                      type="button"
                      className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors text-left"
                    >
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={conv.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {conv.name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between">
                          <p className="font-medium text-sm truncate">
                            {conv.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {conv.time}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.last_message}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}