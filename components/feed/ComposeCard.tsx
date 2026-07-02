'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Lightbulb, Code2, Trophy, Rocket, FileText, MessageSquare } from 'lucide-react'
import { ComposeDialog } from './ComposeDialog'

interface ComposeCardProps {
  user: any
}

const postTypes = [
  { id: 'idea', label: 'Idea', icon: Lightbulb, color: 'text-amber-500' },
  { id: 'build_log', label: 'Build Log', icon: Code2, color: 'text-emerald-500' },
  { id: 'milestone', label: 'Milestone', icon: Trophy, color: 'text-yellow-500' },
  { id: 'launch', label: 'Launch', icon: Rocket, color: 'text-orange-500' },
  { id: 'looking_for', label: 'Looking For', icon: FileText, color: 'text-blue-500' },
  { id: 'discussion', label: 'Discussion', icon: MessageSquare, color: 'text-purple-500' },
]

export function ComposeCard({ user }: ComposeCardProps) {
  const [open, setOpen] = useState(false)
  const [presetType, setPresetType] = useState<string>('update')

  const openCompose = (type: string = 'update') => {
    setPresetType(type)
    setOpen(true)
  }

  return (
    <>
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-4 space-y-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback>
              {user?.full_name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <button
            type="button"
            onClick={() => openCompose('update')}
            className="flex-1 text-left px-4 py-2.5 rounded-full bg-muted/40 hover:bg-muted/60 transition-colors text-sm text-muted-foreground"
          >
            What are you building today, {user?.full_name?.split(' ')[0]}?
          </button>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {postTypes.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => openCompose(type.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-muted/40 transition-colors text-xs font-medium whitespace-nowrap"
              >
                <Icon className={`w-3.5 h-3.5 ${type.color}`} />
                {type.label}
              </button>
            )
          })}
        </div>
      </div>

      <ComposeDialog
        open={open}
        onOpenChange={setOpen}
        user={user}
        initialType={presetType}
      />
    </>
  )
}