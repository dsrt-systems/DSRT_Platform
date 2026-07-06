'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useDropzone } from 'react-dropzone'
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
  Loader2,
  Mic,
  Square,
  Sparkles,
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
  const [media, setMedia] = useState<{ url: string; type: 'image' | 'audio' }[]>([])
  const [uploading, setUploading] = useState(false)
  const [aiHelping, setAiHelping] = useState(false)

  // Voice recording state
  const [recording, setRecording] = useState(false)
  const [recordDuration, setRecordDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 4,
    maxSize: 10 * 1024 * 1024,
    disabled: uploading || media.filter(m => m.type === 'image').length >= 4,
    onDrop: async (files) => {
      setUploading(true)
      const newItems: { url: string; type: 'image' | 'audio' }[] = []
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const { error } = await supabase.storage
          .from('post-media')
          .upload(path, file, { cacheControl: '3600' })
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('post-media').getPublicUrl(path)
          newItems.push({ url: publicUrl, type: 'image' })
        }
      }
      setMedia([...media, ...newItems])
      setUploading(false)
    },
  })

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach((t) => t.stop())

        // Upload
        setUploading(true)
        const path = `${user.id}/voice-${Date.now()}.webm`
        const { error } = await supabase.storage
          .from('post-media')
          .upload(path, blob, { contentType: 'audio/webm' })

        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('post-media').getPublicUrl(path)
          setMedia((m) => [...m, { url: publicUrl, type: 'audio' }])
        }
        setUploading(false)
      }

      recorder.start()
      setRecording(true)
      setRecordDuration(0)
      timerRef.current = setInterval(() => {
        setRecordDuration((d) => {
          if (d >= 30) {
            stopRecording()
            return 30
          }
          return d + 1
        })
      }, 1000)
    } catch (err) {
      alert('Could not access microphone. Please allow microphone access.')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const handleAddTag = () => {
    const t = tagInput.trim().replace(/^#/, '')
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  const removeMedia = (url: string) => {
    setMedia(media.filter((m) => m.url !== url))
  }

  const improveWithAI = async () => {
    if (!content.trim()) {
      alert('Write something first, then I can improve it.')
      return
    }
    setAiHelping(true)

    try {
      const res = await fetch('/api/writing-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: content,
          type,
          action: 'improve',
        }),
      })
      const data = await res.json()
      if (data.improved) {
        setContent(data.improved)
      }
    } catch {}

    setAiHelping(false)
  }

  const handlePost = async () => {
    if (!content.trim() && media.length === 0) return
    setLoading(true)

    const mediaUrls = media.map((m) => m.url)

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      type,
      content: content.trim(),
      tags,
      media_urls: mediaUrls,
      visibility: 'global',
    })

    setLoading(false)

    if (!error) {
      setContent('')
      setTags([])
      setMedia([])
      setType('update')
      onOpenChange(false)
      router.refresh()
    } else {
      alert('Failed to post: ' + error.message)
    }
  }

  const imageCount = media.filter((m) => m.type === 'image').length
  const hasAudio = media.some((m) => m.type === 'audio')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={getPlaceholder(type)}
            rows={5}
            maxLength={2000}
            className="w-full p-3 text-sm rounded-lg bg-muted/40 border-0 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />

          {/* Media previews */}
          {media.length > 0 && (
            <div className="space-y-2">
              {/* Images grid */}
              {imageCount > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {media
                    .filter((m) => m.type === 'image')
                    .map((m) => (
                      <div key={m.url} className="relative">
                        <img
                          src={m.url}
                          alt=""
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeMedia(m.url)}
                          className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm p-1 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {/* Audio */}
              {media
                .filter((m) => m.type === 'audio')
                .map((m) => (
                  <div
                    key={m.url}
                    className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium flex items-center gap-1">
                        🎤 Voice note
                      </p>
                      <button
                        type="button"
                        onClick={() => removeMedia(m.url)}
                        className="p-1 hover:bg-background rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <audio src={m.url} controls className="w-full h-8" />
                  </div>
                ))}
            </div>
          )}

          {/* Recording UI */}
          {recording && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <p className="text-sm font-medium">
                  Recording... {recordDuration}s / 30s
                </p>
              </div>
              <Button size="sm" variant="destructive" onClick={stopRecording}>
                <Square className="w-3 h-3 mr-1" />
                Stop
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-right">
            {content.length}/2000
          </p>

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
                      onClick={() =>
                        setTags(tags.filter((x) => x !== t))
                      }
                      className="hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-1">
              {/* Image upload */}
              <div
                {...getRootProps()}
                className={cn(
                  'p-2 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer',
                  imageCount >= 4 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/40'
                )}
                title="Add image"
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
              </div>

              {/* Voice recording */}
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={hasAudio || uploading}
                className={cn(
                  'p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40',
                  recording && 'text-red-500 animate-pulse',
                  hasAudio && 'opacity-40 cursor-not-allowed'
                )}
                title={hasAudio ? 'Already have a voice note' : 'Record voice note'}
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* AI Writing Assistant */}
              <button
                type="button"
                onClick={improveWithAI}
                disabled={aiHelping || !content.trim()}
                className="p-2 rounded-lg text-purple-500 hover:bg-purple-500/10 disabled:opacity-40"
                title="Improve with AI"
              >
                {aiHelping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </button>

              <span className="text-[10px] text-muted-foreground ml-2">
                {imageCount}/4 images {hasAudio && '· 🎤'}
              </span>
            </div>

            <Button
              onClick={handlePost}
              disabled={(!content.trim() && media.length === 0) || loading}
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