'use client'

import { useState, useTransition } from 'react'
import { Image as ImageIcon, Link as LinkIcon, BarChart2, Send, X, Loader2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSignedUpload } from '@/hooks/useSignedUpload'

interface Props {
  communityId: string
  slug: string
  currentUser?: { avatar_url?: string; full_name?: string }
  onPosted?: () => void
}

type Mode = 'text' | 'link' | 'poll'

export function PostComposer({ communityId, slug, currentUser, onPosted }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [mode, setMode] = useState<Mode>('text')
  const [body, setBody] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState<string[]>(['', ''])
  const [pollMultiple, setPollMultiple] = useState(false)
  const [pollAnonymous, setPollAnonymous] = useState(false)
  const [attachments, setAttachments] = useState<Array<{ file_id: string; url: string }>>([])
  const [pending, startTransition] = useTransition()
  const { upload, uploading } = useSignedUpload()

  const reset = () => {
    setBody('')
    setLinkUrl('')
    setPollQuestion('')
    setPollOptions(['', ''])
    setPollMultiple(false)
    setPollAnonymous(false)
    setAttachments([])
    setMode('text')
    setExpanded(false)
  }

  const submit = () => {
    if (mode === 'text' && !body.trim() && attachments.length === 0) {
      toast.error('Write something')
      return
    }
    if (mode === 'link' && !linkUrl.trim()) {
      toast.error('Enter a link')
      return
    }
    if (mode === 'poll') {
      if (!pollQuestion.trim()) { toast.error('Poll question required'); return }
      if (pollOptions.filter((o) => o.trim()).length < 2) { toast.error('At least 2 options'); return }
    }

    const payload: any = {
      community_id: communityId,
      post_type: mode === 'link' ? 'LINK' : mode === 'poll' ? 'POLL' : 'TEXT',
      body: body.trim() || null,
      visibility: 'MEMBERS',
      attachments: attachments.length > 0 ? attachments.map((a) => ({ file_id: a.file_id, url: a.url, attachment_type: 'IMAGE' })) : undefined,
    }
    if (mode === 'link') payload.link_url = linkUrl.trim()
    if (mode === 'poll') {
      payload.poll = {
        question: pollQuestion.trim(),
        options: pollOptions.map((o) => o.trim()).filter(Boolean),
        multiple_choice: pollMultiple,
        anonymous: pollAnonymous,
        allow_change_vote: true,
      }
    }

    startTransition(async () => {
      const res = await fetch('/api/v1/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `post-${communityId}-${Date.now()}`,
        },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error?.message || 'Post failed')
        return
      }
      toast.success('Posted')
      reset()
      onPosted?.()
    })
  }

  const handleImage = async (file: File) => {
    const result = await upload(file, {
      entity_type: 'community_post',
      entity_id: communityId,
      visibility: 'COMMUNITY',
    })
    if (result) {
      setAttachments((prev) => [...prev, { file_id: result.file_id, url: result.public_url }])
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-4">
      <div className="flex items-start gap-3">
        <Avatar className="w-9 h-9 border border-white/[0.06] flex-shrink-0">
          <AvatarImage src={currentUser?.avatar_url ?? undefined} />
          <AvatarFallback className="text-[11px] bg-white/[0.06] text-white/80">
            {(currentUser?.full_name || '?').charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-3">
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="w-full text-left rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] px-3 py-2.5 text-[13px] text-white/45 transition-colors"
            >
              Share an update, ask a question, or start a poll…
            </button>
          ) : (
            <>
              <div className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
                <ModeButton k="text" active={mode} setActive={setMode} icon={ImageIcon} label="Post" />
                <ModeButton k="link" active={mode} setActive={setMode} icon={LinkIcon} label="Link" />
                <ModeButton k="poll" active={mode} setActive={setMode} icon={BarChart2} label="Poll" />
              </div>

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder={mode === 'poll' ? 'Optional context…' : 'What do you want to share?'}
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] focus:border-white/[0.14] outline-none px-3 py-2.5 text-[13.5px] text-white placeholder:text-white/30 resize-none leading-relaxed"
              />

              {mode === 'link' && (
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] focus:border-white/[0.14] outline-none px-3 py-2 text-[13px] text-white placeholder:text-white/30 font-mono"
                />
              )}

              {mode === 'poll' && (
                <div className="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <input
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Poll question"
                    className="w-full rounded-md border border-white/[0.06] bg-white/[0.02] focus:border-white/[0.14] outline-none px-3 py-2 text-[13px] text-white placeholder:text-white/30"
                  />
                  {pollOptions.map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={o}
                        onChange={(e) => setPollOptions((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 rounded-md border border-white/[0.06] bg-white/[0.02] focus:border-white/[0.14] outline-none px-3 py-2 text-[12.5px] text-white placeholder:text-white/30"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          onClick={() => setPollOptions((prev) => prev.filter((_, idx) => idx !== i))}
                          className="w-7 h-7 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/50 hover:text-white flex items-center justify-center"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 8 && (
                    <button
                      onClick={() => setPollOptions((prev) => [...prev, ''])}
                      className="inline-flex items-center gap-1 text-[11.5px] text-white/60 hover:text-white transition-colors"
                    >
                      <Plus className="w-3 h-3" strokeWidth={2} />
                      Add option
                    </button>
                  )}
                  <div className="flex items-center gap-3 pt-2 border-t border-white/[0.04]">
                    <label className="inline-flex items-center gap-1.5 text-[11.5px] text-white/70 cursor-pointer">
                      <input type="checkbox" checked={pollMultiple} onChange={(e) => setPollMultiple(e.target.checked)} className="accent-white" />
                      Multiple choice
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-[11.5px] text-white/70 cursor-pointer">
                      <input type="checkbox" checked={pollAnonymous} onChange={(e) => setPollAnonymous(e.target.checked)} className="accent-white" />
                      Anonymous
                    </label>
                  </div>
                </div>
              )}

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((a, i) => (
                    <div key={a.file_id} className="relative w-24 h-24 rounded-lg border border-white/[0.06] overflow-hidden">
                      <img src={a.url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 border border-white/20 text-white flex items-center justify-center"
                      >
                        <X className="w-2.5 h-2.5" strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <label className="cursor-pointer inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-white/70 hover:text-white px-2.5 py-1 text-[11.5px] font-medium transition-colors">
                    {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" strokeWidth={1.75} />}
                    Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleImage(f)
                      }}
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={reset}
                    className="text-[12px] text-white/50 hover:text-white px-3 py-1.5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={pending}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full bg-white text-black hover:bg-zinc-100 px-4 py-1.5 text-[12px] font-semibold transition-colors',
                      pending && 'opacity-70'
                    )}
                  >
                    {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" strokeWidth={2} />}
                    Post
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ModeButton({ k, active, setActive, icon: Icon, label }: any) {
  const isActive = active === k
  return (
    <button
      onClick={() => setActive(k)}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11.5px] font-medium transition-colors',
        isActive ? 'bg-white text-black' : 'text-white/60 hover:text-white'
      )}
    >
      <Icon className="w-3 h-3" strokeWidth={1.75} />
      {label}
    </button>
  )
}