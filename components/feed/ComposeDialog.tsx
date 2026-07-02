'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Lightbulb,
  Code2,
  Trophy,
  Rocket,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Hash,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const postTypes = [
  { id: 'update', label: 'Update', icon: MessageSquare, color: 'text-foreground' },
  { id: 'idea', label: 'Idea', icon: Lightbulb, color: 'text-amber-500' },
  { id: 'build_log', label: 'Build Log', icon: Code2, color: 'text-emerald-500' },
  { id: 'milestone', label: 'Milestone', icon: Trophy, color: 'text-yellow-500' },
  { id: 'launch', label: 'Launch', icon: Rocket, color: 'text-orange-500' },
  { id: 'looking_for', label: 'Looking For', icon: FileText, color: 'text-blue-500' },
  { id: 'discussion', label: 'Discussion', icon: MessageSquare, color: 'text-purple-500' },
]

interface ComposeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
  initialType?: string
}

export function ComposeDialog({
  open,
  onOpenChange,
  user,
  initialType = 'update',
}: ComposeDialogProps) {
  const router = useRouter()
  const supabase = createClient()

  const [type, setType] = useState(initialType)
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddTag = () => {
    const t = tagInput.trim().replace(/^#/, '')
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  const handlePost = async () => {
    if (!content.trim()) return
    setLoading(true)

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      type,
      content: content.trim(),
      tags,
      visibility: 'global',
    })

    setLoading(false)

    if (!error) {
      setContent('')
      setTags([])
      setType('update')
      onOpenChange(false)
      router.refresh()
    } else {
      console.error('Post error:', error)
      alert('Failed to post: ' + error.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create a post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>
                {user.full_name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{user.full_name}</p>
              <p className="text-xs text-muted-foreground">
                Posting to Global Feed
              </p>
            </div>
          </div>

          {/* Type selector */}
          <div className="flex flex-wrap gap-1.5">
            {postTypes.map((t) => {
              const Icon = t.icon
              const active = type === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/40 hover:bg-muted/60'
                  )}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? '' : t.color}`} />
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={getPlaceholder(type)}
            rows={6}
            maxLength={2000}
            className="w-full p-3 text-sm rounded-lg bg-muted/40 border-0 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {content.length}/2000
          </p>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="Add tag (press Enter)"
                className="flex-1 text-xs bg-transparent border-0 focus:outline-none"
              />
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                      className="hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                title="Add image (coming soon)"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>

            <Button
              onClick={handlePost}
              disabled={!content.trim() || loading}
              size="sm"
            >
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getPlaceholder(type: string): string {
  const placeholders: Record<string, string> = {
    update: 'What are you building today?',
    idea: 'Share an idea you have been thinking about...',
    build_log: 'What did you ship today? What did you learn?',
    milestone: 'What did you just achieve? Tell the community.',
    launch: 'What did you just launch? Drop the link.',
    looking_for: 'Who or what are you looking for? Be specific.',
    discussion: 'Start a discussion. Ask a question. Share an opinion.',
  }
  return placeholders[type] || placeholders.update
}