'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Sparkles, Trophy, Lightbulb, UserPlus, HandHeart, HelpCircle, Image as ImageIcon, Link as LinkIcon, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const postTypes = [
  { id: 'update', label: 'Update', icon: Sparkles, color: 'text-blue-500 bg-blue-500/10' },
  { id: 'milestone', label: 'Milestone', icon: Trophy, color: 'text-yellow-500 bg-yellow-500/10' },
  { id: 'idea', label: 'Idea', icon: Lightbulb, color: 'text-purple-500 bg-purple-500/10' },
  { id: 'looking_for', label: 'Looking For', icon: UserPlus, color: 'text-green-500 bg-green-500/10' },
  { id: 'i_have', label: 'I Have', icon: HandHeart, color: 'text-pink-500 bg-pink-500/10' },
  { id: 'question', label: 'Question', icon: HelpCircle, color: 'text-orange-500 bg-orange-500/10' },
]

export function PostComposer({ currentUser, onPost }: any) {
  const [expanded, setExpanded] = useState(false)
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState('update')
  const [tags, setTags] = useState('')
  const [posting, setPosting] = useState(false)

  const supabase = createClient()

  const handlePost = async () => {
    if (!content.trim()) {
      toast.error('Write something first')
      return
    }

    setPosting(true)

    const tagsArray = tags
      .split(/[\s,]+/)
      .map(t => t.replace(/^#/, '').trim())
      .filter(Boolean)
      .slice(0, 5)

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: currentUser.id,
        type: postType,
        content: content.trim(),
        tags: tagsArray,
        visibility: 'global',
      })
      .select()
      .single()

    setPosting(false)

    if (error) {
      toast.error('Failed to post: ' + error.message)
      return
    }

    toast.success('Posted')
    onPost(data)
    setContent('')
    setTags('')
    setExpanded(false)
  }

  const selectedType = postTypes.find(t => t.id === postType)!

  return (
    <div className="bg-card border rounded-2xl overflow-hidden">
      <div className="p-4">
        <div className="flex gap-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={currentUser?.avatar_url} />
            <AvatarFallback>
              {currentUser?.full_name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setExpanded(true)}
              placeholder="What are you building today?"
              rows={expanded ? 4 : 2}
              className="w-full resize-none bg-transparent border-0 focus:outline-none text-sm placeholder:text-muted-foreground"
              maxLength={500}
            />

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-2"
                >
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Tags: #ai #startup (up to 5)"
                    className="w-full text-xs bg-transparent border-0 focus:outline-none placeholder:text-muted-foreground/60"
                  />

                  <div className="flex flex-wrap gap-1.5">
                    {postTypes.map(type => {
                      const Icon = type.icon
                      const isSelected = postType === type.id
                      return (
                        <button
                          key={type.id}
                          onClick={() => setPostType(type.id)}
                          className={cn(
                            'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                            isSelected ? type.color : 'bg-muted hover:bg-muted/70'
                          )}
                        >
                          <Icon className="w-3 h-3" />
                          {type.label}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-[10px] text-muted-foreground">
                      {content.length}/500
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setExpanded(false)
                          setContent('')
                          setTags('')
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handlePost}
                        disabled={posting || !content.trim()}
                      >
                        {posting ? 'Posting...' : 'Post'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}