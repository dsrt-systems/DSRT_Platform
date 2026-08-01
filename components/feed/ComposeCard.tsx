'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Lightbulb,
  Code2,
  Trophy,
  Rocket,
  FileText,
  MessageSquare,
} from 'lucide-react'
import { ComposeDialog } from './ComposeDialog'

interface ComposeCardProps {
  user: any
}

const POST_TYPES = [
  { id: 'idea', label: 'IDEA', icon: Lightbulb, color: 'text-amber-500' },
  { id: 'build_log', label: 'BUILD LOG', icon: Code2, color: 'text-emerald-500' },
  { id: 'milestone', label: 'MILESTONE', icon: Trophy, color: 'text-yellow-500' },
  { id: 'launch', label: 'LAUNCH', icon: Rocket, color: 'text-orange-500' },
  { id: 'looking_for', label: 'LOOKING FOR', icon: FileText, color: 'text-blue-500' },
  { id: 'discussion', label: 'DISCUSSION', icon: MessageSquare, color: 'text-purple-500' },
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
      <div className="skeu-card p-3">
        <div className="flex items-center gap-2.5">
          <Avatar className="w-9 h-9 border border-border">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="text-xs">
              {user?.full_name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <button
            type="button"
            onClick={() => openCompose('update')}
            className="flex-1 text-left px-3 py-2 skeu-inset text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            What are you building, {user?.full_name?.split(' ')[0]}?
          </button>
        </div>

        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border overflow-x-auto">
          {POST_TYPES.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => openCompose(type.id)}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono tracking-wider hover:bg-muted transition-colors whitespace-nowrap"
              >
                <Icon className={`w-3 h-3 ${type.color}`} />
                <span>{type.label}</span>
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