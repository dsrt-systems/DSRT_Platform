'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  X, ArrowsOut, ArrowsIn, Paperclip, ImageSquare, 
  Buildings, Rocket, TrashSimple, Sparkle, Minus
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useComposer, ComposeInitialState } from './ComposerContext'
import { useMailIdentity } from '../hooks/useMailIdentity'
import { FromIdentityPicker } from './FromIdentityPicker'
import { RecipientField } from './RecipientField'
import { RichEditor } from './RichEditor'
import { AttachmentPanel } from './AttachmentPanel'
import { EntityAttachPicker } from './EntityAttachPicker'
import { SendButton } from './SendButton'

interface Props {
  mode: 'quick' | 'full'
  initialState: ComposeInitialState | null
}

export function ComposerCore({ mode, initialState }: Props) {
  const { closeCompose, toggleFullscreen, isFullscreen } = useComposer()
  const { identities, activeIdentity, isUnified } = useMailIdentity()

  const activeIdString = typeof activeIdentity === 'object' && activeIdentity !== null 
    ? activeIdentity.identity_id : null
  const defaultFromId = 
    initialState?.from_identity_id ||
    (!isUnified ? activeIdString : null) ||
    identities.find(i => i.entity_type === 'user')?.identity_id ||
    identities[0]?.identity_id ||
    null

  const [fromIdentityId, setFromIdentityId] = useState<string | null>(defaultFromId)
  const [to, setTo] = useState<any[]>(initialState?.to || [])
  const [cc, setCc] = useState<any[]>(initialState?.cc || [])
  const [bcc, setBcc] = useState<any[]>(initialState?.bcc || [])
  const [showCc, setShowCc] = useState(cc.length > 0 || bcc.length > 0)
  const [subject, setSubject] = useState(initialState?.subject || '')
  const [bodyHtml, setBodyHtml] = useState(initialState?.body_html || '')
  const [attachments, setAttachments] = useState<any[]>(initialState?.attachments || [])
  const [entityAttachments, setEntityAttachments] = useState<any[]>(initialState?.entity_attachments || [])
  const [sending, setSending] = useState(false)
  
  // FIX: Load draft_id from initial state so autosave updates instead of duplicates
  const [draftId, setDraftId] = useState<string | null>((initialState as any)?.draft_id || null)
  
  const [savingDraft, setSavingDraft] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [entityPickerType, setEntityPickerType] = useState<'venture' | 'project' | null>(null)
  const [minimized, setMinimized] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- AUTOSAVE ---
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const doSave = useCallback(async () => {
    if (!fromIdentityId) return
    setSavingDraft(true)
    try {
      const payload = {
        from_identity_id: fromIdentityId,
        to, cc, bcc,
        subject,
        body_html: bodyHtml,
        attachments,
        entity_attachments: entityAttachments,
        reply_to_thread_id: initialState?.reply_to_thread_id,
        reply_to_message_id: initialState?.reply_to_message_id,
        compose_mode: initialState?.mode || 'new',
      }
      if (draftId) {
        await fetch(`/api/mail/drafts/${draftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        const res = await fetch('/api/mail/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.draft?.id) setDraftId(data.draft.id)
      }
      setLastSaved(new Date())
    } catch (e) {
      console.error('Draft save error:', e)
    } finally {
      setSavingDraft(false)
    }
  }, [
    fromIdentityId, to, cc, bcc, subject, bodyHtml, 
    attachments, entityAttachments, draftId, initialState
  ])

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (!subject && !bodyHtml && to.length === 0 && attachments.length === 0) return
    saveTimerRef.current = setTimeout(doSave, 1500)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [subject, bodyHtml, to, cc, bcc, attachments, entityAttachments, doSave])

  // --- VALIDATION ---
  const isUploading = attachments.some(a => a.uploading)
  const canSend = 
    fromIdentityId && 
    to.length > 0 && 
    subject.trim().length > 0 && 
    bodyHtml.replace(/<[^>]*>/g, '').trim().length > 0 && 
    !isUploading

  // --- SEND ---
  const handleSend = async (scheduledSendAt?: Date) => {
    if (!canSend) {
      if (!fromIdentityId) toast.error('Please select a sender identity')
      else if (to.length === 0) toast.error('Please add at least one recipient')
      else if (!subject.trim()) toast.error('Please add a subject')
      else if (!bodyHtml.trim()) toast.error('Please write a message')
      else if (isUploading) toast.error('Please wait for attachments to finish uploading')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_identity_id: fromIdentityId,
          to, cc, bcc,
          subject: subject.trim(),
          body_html: bodyHtml,
          attachments,
          entity_attachments: entityAttachments,
          source_type: initialState?.source_type || 'direct',
          source_entity_type: initialState?.source_entity_type,
          source_entity_id: initialState?.source_entity_id,
          reply_to_thread_id: initialState?.reply_to_thread_id,
          reply_to_message_id: initialState?.reply_to_message_id,
          draft_id: draftId,
          scheduled_send_at: scheduledSendAt?.toISOString(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')

      if (scheduledSendAt) {
        toast.success('Message scheduled', {
          description: `Will send on ${scheduledSendAt.toLocaleString()}`,
        })
      } else {
        toast.success('Message sent', {
          description: `Delivered to ${data.recipient_count} recipient${data.recipient_count !== 1 ? 's' : ''}`,
        })
      }

      closeCompose()
      window.dispatchEvent(new Event('mail:refresh'))
      window.dispatchEvent(new Event('mail:counts:refresh'))
    } catch (e: any) {
      toast.error(e.message || 'Failed to send')
      setSending(false)
    }
  }

  const handleDiscard = async () => {
    if (draftId) {
      await fetch(`/api/mail/drafts/${draftId}`, { method: 'DELETE' })
      toast.success('Draft discarded')
      window.dispatchEvent(new Event('mail:refresh'))
      window.dispatchEvent(new Event('mail:counts:refresh'))
    }
    closeCompose()
  }

  const handleFileClick = () => fileInputRef.current?.click()

  // --- FILE UPLOAD ---
  const handleFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const filesArr = Array.from(files)

    // Validate
    const MAX_SIZE = 25 * 1024 * 1024
    const oversized = filesArr.filter(f => f.size > MAX_SIZE)
    if (oversized.length > 0) {
      toast.error(`Files over 25MB are not allowed: ${oversized.map(f => f.name).join(', ')}`)
      return
    }
    if (attachments.length + filesArr.length > 15) {
      toast.error('Maximum 15 attachments per message')
      return
    }

    const placeholders = filesArr.map(f => ({
      url: '', name: f.name, size: f.size, type: f.type,
      uploading: true, uploadProgress: 0,
    }))
    let newList = [...attachments, ...placeholders]
    setAttachments(newList)

    for (const file of filesArr) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/mail/attachments/upload', { 
          method: 'POST', 
          body: fd 
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Upload failed')

        newList = newList.map(a => 
          (a.uploading && a.name === file.name && a.size === file.size) 
            ? { 
                url: data.url, 
                name: data.name, 
                size: data.size, 
                type: data.type, 
                path: data.path 
              } 
            : a
        )
        setAttachments(newList)
      } catch (err: any) {
        toast.error(`${file.name}: ${err.message || 'Upload failed'}`)
        newList = newList.filter(a => !(a.uploading && a.name === file.name))
        setAttachments(newList)
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // --- COMPOSER DIMENSIONS ---
  const modeClasses = isFullscreen
    ? "w-[min(95vw,1200px)] h-[min(92vh,900px)] rounded-2xl"
    : minimized
    ? "w-[280px] h-[44px] rounded-t-xl"
    : "w-[720px] h-[min(85vh,720px)] rounded-t-xl"

  // --- MINIMIZED VIEW ---
  if (minimized && !isFullscreen) {
    return (
      <div className={cn(
        "bg-gradient-to-b from-[#141419] to-[#0a0a0f]",
        "border border-white/[0.1] shadow-2xl flex items-center overflow-hidden",
        modeClasses
      )}>
        <button
          onClick={() => setMinimized(false)}
          className="flex-1 flex items-center gap-2 px-4 h-full hover:bg-white/[0.03] transition-colors text-left"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[12px] font-bold text-white truncate">
            {subject || 'New message'}
          </p>
        </button>
        <button
          onClick={() => setMinimized(false)}
          className="w-8 h-full hover:bg-white/[0.06] text-white/60 hover:text-white flex items-center justify-center"
        >
          <ArrowsOut className="w-3.5 h-3.5" weight="bold" />
        </button>
        <button
          onClick={closeCompose}
          className="w-8 h-full hover:bg-white/[0.06] text-white/60 hover:text-white flex items-center justify-center"
        >
          <X className="w-3.5 h-3.5" weight="bold" />
        </button>
      </div>
    )
  }

  return (
    <div className={cn(
      "bg-gradient-to-b from-[#12121a] to-[#0a0a0f]",
      "border border-white/[0.1] shadow-[0_20px_80px_rgba(0,0,0,0.6)]",
      "flex flex-col overflow-hidden",
      modeClasses
    )}>
      {/* Header */}
      <div className="h-11 px-4 flex items-center justify-between bg-white/[0.02] border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2">
          <p className="text-[12.5px] font-bold text-white tracking-tight">
            {initialState?.mode === 'reply' ? 'Reply' : 
             initialState?.mode === 'reply_all' ? 'Reply all' :
             initialState?.mode === 'forward' ? 'Forward' : 'New message'}
          </p>
          {lastSaved && !savingDraft && (
            <span className="text-[10px] text-white/35">
              · Saved {lastSaved.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          {savingDraft && (
            <span className="text-[10px] text-white/45">· Saving...</span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {!isFullscreen && (
            <button 
              onClick={() => setMinimized(true)} 
              className="w-7 h-7 rounded-md hover:bg-white/[0.06] text-white/50 hover:text-white flex items-center justify-center"
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5" weight="bold" />
            </button>
          )}
          <button 
            onClick={toggleFullscreen} 
            className="w-7 h-7 rounded-md hover:bg-white/[0.06] text-white/50 hover:text-white flex items-center justify-center"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <ArrowsIn className="w-3.5 h-3.5" weight="bold" /> : <ArrowsOut className="w-3.5 h-3.5" weight="bold" />}
          </button>
          <button 
            onClick={closeCompose} 
            className="w-7 h-7 rounded-md hover:bg-red-500/10 text-white/50 hover:text-red-400 flex items-center justify-center"
            title="Close"
          >
            <X className="w-3.5 h-3.5" weight="bold" />
          </button>
        </div>
      </div>

      {/* From */}
      <div className="px-4 py-2.5 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-white/45 uppercase tracking-wider w-8 flex-shrink-0">
            From
          </span>
          <div className="flex-1">
            <FromIdentityPicker value={fromIdentityId} onChange={setFromIdentityId} />
          </div>
        </div>
      </div>

      {/* Recipients */}
      <RecipientField label="To" value={to} onChange={setTo} autoFocus={to.length === 0} />
      {showCc && (
        <>
          <RecipientField label="Cc" value={cc} onChange={setCc} />
          <RecipientField label="Bcc" value={bcc} onChange={setBcc} />
        </>
      )}
      {!showCc && (
        <div className="px-4 py-1.5 flex items-center gap-3 border-b border-white/[0.05]">
          <div className="w-8" />
          <button 
            onClick={() => setShowCc(true)} 
            className="text-[11px] text-white/45 hover:text-white font-semibold transition-colors"
          >
            Add Cc / Bcc
          </button>
        </div>
      )}

      {/* Subject */}
      <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center gap-3">
        <span className="text-[11px] font-bold text-white/45 uppercase tracking-wider w-8 flex-shrink-0">
          Sub
        </span>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Subject line..."
          className="flex-1 h-7 bg-transparent text-[14px] font-semibold text-white placeholder:text-white/30 focus:outline-none"
        />
      </div>

      {/* Editor — LARGE, PROFESSIONAL */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <RichEditor 
          value={bodyHtml} 
          onChange={setBodyHtml}
          minHeight={isFullscreen ? '450px' : '320px'}
        />
      </div>

      {/* Entity attachments */}
      {entityAttachments.length > 0 && (
        <div className="border-t border-white/[0.05] px-4 py-2.5 bg-white/[0.01] flex-shrink-0">
          <p className="text-[9.5px] uppercase tracking-wider font-bold text-white/40 mb-2">
            {entityAttachments.length} attached entit{entityAttachments.length !== 1 ? 'ies' : 'y'}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {entityAttachments.map((ea, i) => {
              const EIcon = ea.type === 'venture' ? Buildings : Rocket
              const color = ea.type === 'venture' ? 'text-violet-400' : 'text-emerald-400'
              return (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] group">
                  <div className="w-7 h-7 rounded-md overflow-hidden bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                    {ea.logo_url ? <img src={ea.logo_url} alt="" className="w-full h-full object-cover" /> : <EIcon className={cn("w-3.5 h-3.5", color)} weight="fill" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11.5px] font-bold text-white truncate">{ea.name}</p>
                    <p className="text-[9.5px] text-white/45 uppercase tracking-wider font-semibold">{ea.type}</p>
                  </div>
                  <button
                    onClick={() => setEntityAttachments(entityAttachments.filter((_, idx) => idx !== i))}
                    className="w-6 h-6 rounded hover:bg-white/[0.08] text-white/40 hover:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" weight="bold" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* File attachments */}
      <AttachmentPanel attachments={attachments} onChange={setAttachments} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => handleFilesUpload(e.target.files)}
      />

      {/* Footer */}
      <div className="h-14 px-3 flex items-center justify-between border-t border-white/[0.06] bg-white/[0.02] flex-shrink-0">
        <div className="flex items-center gap-0.5">
          <button 
            onClick={handleFileClick} 
            title="Attach file (max 25MB each, 15 total)" 
            className="w-8 h-8 rounded-md hover:bg-white/[0.06] text-white/50 hover:text-white flex items-center justify-center transition-colors"
          >
            <Paperclip className="w-4 h-4" weight="bold" />
          </button>
          <button 
            onClick={handleFileClick} 
            title="Insert image" 
            className="w-8 h-8 rounded-md hover:bg-white/[0.06] text-white/50 hover:text-white flex items-center justify-center transition-colors"
          >
            <ImageSquare className="w-4 h-4" weight="bold" />
          </button>
          <div className="w-px h-5 bg-white/[0.08] mx-1" />
          <button 
            onClick={() => setEntityPickerType('venture')} 
            title="Attach venture" 
            className="w-8 h-8 rounded-md hover:bg-white/[0.06] text-white/50 hover:text-violet-300 flex items-center justify-center transition-colors"
          >
            <Buildings className="w-4 h-4" weight="bold" />
          </button>
          <button 
            onClick={() => setEntityPickerType('project')} 
            title="Attach project" 
            className="w-8 h-8 rounded-md hover:bg-white/[0.06] text-white/50 hover:text-emerald-300 flex items-center justify-center transition-colors"
          >
            <Rocket className="w-4 h-4" weight="bold" />
          </button>
          <div className="w-px h-5 bg-white/[0.08] mx-1" />
          <button 
            title="COCO AI (coming soon)" 
            className="w-8 h-8 rounded-md hover:bg-white/[0.06] text-white/50 hover:text-violet-300 flex items-center justify-center transition-colors"
          >
            <Sparkle className="w-4 h-4" weight="bold" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDiscard}
            className="w-8 h-8 rounded-md hover:bg-white/[0.06] text-white/50 hover:text-red-400 flex items-center justify-center transition-colors"
            title="Discard draft"
          >
            <TrashSimple className="w-4 h-4" />
          </button>
          <SendButton 
            onSend={() => handleSend()} 
            onSchedule={(date) => handleSend(date)}
            sending={sending} 
            disabled={!canSend} 
          />
        </div>
      </div>

      {/* Entity picker modal */}
      {entityPickerType && (
        <EntityAttachPicker
          type={entityPickerType}
          onClose={() => setEntityPickerType(null)}
          onAttach={(ea) => {
            setEntityAttachments([...entityAttachments, ea])
            setEntityPickerType(null)
          }}
        />
      )}
    </div>
  )
}