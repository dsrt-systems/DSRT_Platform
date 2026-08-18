'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ComposerProvider, useComposer } from './ComposerContext'
import { ComposerHeader } from './ComposerHeader'
import { IdentityPicker } from './IdentityPicker'
import { PostTypeSelector } from './PostTypeSelector'
import { RichEditor } from './RichEditor'
import { MediaAttachments } from './MediaAttachments'
import { ComposerToolbar } from './ComposerToolbar'
import { useComposerAutosave } from './hooks/useComposerAutosave'

interface Props {
  open: boolean
  onClose: () => void
  currentUser?: any
}

export function HomeComposerModal({ open, onClose, currentUser }: Props) {
  if (!open) return null

  return (
    <ComposerProvider>
      <ComposerInner onClose={onClose} currentUser={currentUser} />
    </ComposerProvider>
  )
}

function ComposerInner({ onClose, currentUser }: { onClose: () => void; currentUser?: any }) {
  const router = useRouter()
  const composer = useComposer()
  const { status: autosaveStatus } = useComposerAutosave(true)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !publishing) {
        e.preventDefault()
        handleClose()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handlePublish()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishing])

  const handleClose = () => {
    const hasContent = composer.content.trim() || composer.title.trim() || composer.media.length > 0
    if (hasContent && autosaveStatus !== 'saved') {
      const userConfirmed = window.confirm('Save this post as a draft?')
      if (!userConfirmed) return
    }
    composer.reset()
    onClose()
  }

  const handlePublish = async () => {
    if (!composer.publisher) {
      setPublishError('Please select who to post as')
      return
    }
    const hasContent = composer.content.trim() || composer.media.length > 0
    if (!hasContent) {
      setPublishError('Add some content or media first')
      return
    }

    setPublishing(true)
    setPublishError(null)

    try {
      const payload = {
        ...composer.serialize(),
        is_draft: false,
        draft_id: composer.draftId,
      }

      const res = await fetch('/api/home/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to publish')
      }

      composer.reset()
      onClose()
      router.refresh()
    } catch (e: any) {
      setPublishError(e?.message || 'Something went wrong')
    } finally {
      setPublishing(false)
    }
  }

  const canPublish = !!composer.publisher &&
    (composer.content.trim().length > 0 || composer.media.length > 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-3xl max-h-[92vh] rounded-2xl border border-zinc-800 bg-[#0a0a0a] overflow-hidden flex flex-col shadow-[0_20px_80px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <ComposerHeader onClose={handleClose} autosaveStatus={autosaveStatus} />

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <IdentityPicker />
          <PostTypeSelector />
          <RichEditor />
          <MediaAttachments />

          {publishError && (
            <div className="p-3 rounded-md border border-red-500/30 bg-red-500/5 text-[12.5px] text-red-400">
              {publishError}
            </div>
          )}
        </div>

        <div className="shrink-0 px-6 py-4 bg-zinc-950/40">
          <ComposerToolbar
            onPublish={handlePublish}
            publishing={publishing}
            canPublish={canPublish}
          />
        </div>
      </div>
    </div>
  )
}