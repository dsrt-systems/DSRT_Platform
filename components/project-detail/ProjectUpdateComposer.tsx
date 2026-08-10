'use client'

import { useState, useRef, useEffect } from 'react'
import {
  X, Rocket, Hammer, TestTube, ChartLineUp, Bug, Megaphone, Handshake, Lightbulb,
  Circle, Image as ImageIcon, VideoCamera, LinkSimple, Tag, Flag,
  Paperclip, Trash, Check, Warning, Info, CaretDown
} from '@phosphor-icons/react'
import { MarkdownEditor } from './MarkdownEditor'
import { ImageCropperModal } from './ImageCropperModal'

interface Props {
  slug: string
  currentStage: string
  onClose: () => void
  onPosted: () => void
  onUploadImage: (file: File, kind: 'update') => Promise<string | null>
  onUploadAttachment: (file: File) => Promise<{ url: string; name: string; size: number; type: string } | null>
}

const UPDATE_TYPES = [
  { id: 'general',       label: 'General Update',    icon: Circle,       color: 'text-white/60',   bg: 'bg-white/[0.05]',      border: 'border-white/[0.12]' },
  { id: 'release',       label: 'Release',           icon: Rocket,       color: 'text-purple-300', bg: 'bg-purple-500/10',     border: 'border-purple-500/25' },
  { id: 'building',      label: 'Building',          icon: Hammer,       color: 'text-orange-300', bg: 'bg-orange-500/10',     border: 'border-orange-500/25' },
  { id: 'experiment',    label: 'Experiment',        icon: TestTube,     color: 'text-cyan-300',   bg: 'bg-cyan-500/10',       border: 'border-cyan-500/25' },
  { id: 'progress',      label: 'Progress',          icon: ChartLineUp,  color: 'text-emerald-300', bg: 'bg-emerald-500/10',   border: 'border-emerald-500/25' },
  { id: 'fix',           label: 'Fix',               icon: Bug,          color: 'text-red-300',    bg: 'bg-red-500/10',        border: 'border-red-500/25' },
  { id: 'announcement',  label: 'Announcement',      icon: Megaphone,    color: 'text-yellow-300', bg: 'bg-yellow-500/10',     border: 'border-yellow-500/25' },
  { id: 'collaboration', label: 'Collaboration',     icon: Handshake,    color: 'text-blue-300',   bg: 'bg-blue-500/10',       border: 'border-blue-500/25' },
  { id: 'insight',       label: 'Insight',           icon: Lightbulb,    color: 'text-pink-300',   bg: 'bg-pink-500/10',       border: 'border-pink-500/25' },
]

const STAGES = ['idea','research','planning','prototype','mvp','beta','production','scaling','completed','on-hold']
const STAGE_LABELS: Record<string, string> = {
  idea:'Idea', research:'Research', planning:'Planning', prototype:'Prototype',
  mvp:'MVP', beta:'Beta', production:'Production', scaling:'Scaling',
  completed:'Completed', 'on-hold':'On Hold'
}

interface Attachment {
  url: string
  name: string
  size: number
  type: string
}

function formatBytes(b: number): string {
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / (1024 * 1024)).toFixed(1) + ' MB'
}

export function ProjectUpdateComposer({
  slug, currentStage, onClose, onPosted, onUploadImage, onUploadAttachment
}: Props) {
  const [updateType, setUpdateType] = useState('general')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [video, setVideo] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [milestoneEnabled, setMilestoneEnabled] = useState(false)
  const [milestoneTo, setMilestoneTo] = useState(currentStage)
  const [resourceUrl, setResourceUrl] = useState('')
  const [resourceLabel, setResourceLabel] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [commentsDisabled, setCommentsDisabled] = useState(false)

  const [posting, setPosting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [cropperSrc, setCropperSrc] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const attachInputRef = useRef<HTMLInputElement>(null)

  // Block body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const selectedType = UPDATE_TYPES.find(t => t.id === updateType) || UPDATE_TYPES[0]

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (images.length >= 8) { alert('Max 8 images'); e.target.value=''; return }
    const reader = new FileReader()
    reader.onload = () => setCropperSrc(reader.result as string)
    reader.readAsDataURL(f)
    e.target.value = ''
  }

  const handleCropConfirm = async (blob: Blob) => {
    setUploadingImage(true)
    try {
      const file = new File([blob], 'update-' + Date.now() + '.jpg', { type: 'image/jpeg' })
      const url = await onUploadImage(file, 'update')
      if (url) setImages(prev => [...prev, url])
      setCropperSrc(null)
    } finally { setUploadingImage(false) }
  }

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (video) { alert('Only 1 video per update'); e.target.value=''; return }
    if (f.size > 50 * 1024 * 1024) { alert('Video too large (max 50MB)'); e.target.value=''; return }
    setUploadingVideo(true)
    try {
      const url = await onUploadImage(f, 'update')
      if (url) setVideo(url)
    } finally { setUploadingVideo(false); e.target.value = '' }
  }

  const handleAttachmentSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (attachments.length >= 5) { alert('Max 5 attachments'); e.target.value=''; return }
    setUploadingAttachment(true)
    try {
      const result = await onUploadAttachment(f)
      if (result) setAttachments(prev => [...prev, result])
    } finally { setUploadingAttachment(false); e.target.value = '' }
  }

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '')
    if (!t || tags.includes(t) || tags.length >= 10) return
    setTags(prev => [...prev, t])
    setTagInput('')
  }

  const canPost = !posting && (content.trim().length > 0 || title.trim().length > 0 || images.length > 0 || video || attachments.length > 0)

  const submit = async () => {
    if (!canPost) return
    setPosting(true)
    try {
      const body: Record<string, any> = {
        update_type: updateType,
        title: title.trim() || null,
        content,
        image_urls: images,
        media_urls: video ? [video] : [],
        attachments,
        tags,
        comments_disabled: commentsDisabled,
      }
      if (milestoneEnabled && milestoneTo && milestoneTo !== currentStage) {
        body.milestone_from = currentStage
        body.milestone_to = milestoneTo
      }
      if (resourceUrl.trim() && /^https?:\/\//.test(resourceUrl.trim())) {
        body.resource_url = resourceUrl.trim()
        if (resourceLabel.trim()) body.resource_label = resourceLabel.trim()
      }

      const res = await fetch('/api/projects/' + slug + '/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to post')
      }
      onPosted()
      onClose()
    } catch (e: any) {
      alert(e?.message || 'Failed to post update')
    } finally { setPosting(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-start md:items-center justify-center p-0 md:p-4 overflow-y-auto">
      <div className="bg-[#0f0f18] border border-white/[0.08] w-full max-w-[720px] md:rounded-2xl overflow-hidden flex flex-col min-h-screen md:min-h-0 md:max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={'w-9 h-9 rounded-lg flex items-center justify-center ' + selectedType.bg + ' ' + selectedType.border + ' border'}>
              <selectedType.icon size={17} weight="fill" className={selectedType.color} />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-white">Post an update</h3>
              <p className="text-[12px] text-white/45">Share what's happening with your project</p>
            </div>
          </div>
          <button onClick={onClose} disabled={posting} className="text-white/50 hover:text-white p-1 disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Type picker */}
          <div className="mb-5">
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2 block">Update type</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {UPDATE_TYPES.map(t => {
                const Icon = t.icon
                const active = updateType === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setUpdateType(t.id)}
                    className={
                      'flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border transition-colors text-center ' +
                      (active
                        ? t.bg + ' ' + t.border
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]')
                    }
                  >
                    <Icon size={16} weight={active ? 'fill' : 'regular'} className={active ? t.color : 'text-white/50'} />
                    <span className={'text-[10px] font-medium leading-tight ' + (active ? 'text-white' : 'text-white/60')}>{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              placeholder="Crop Health Detection v2 is Live"
              className="w-full h-11 bg-white/[0.04] border border-white/[0.1] rounded-lg px-3.5 text-[15px] text-white placeholder:text-white/30 outline-none focus:border-white/25"
            />
          </div>

          {/* Content */}
          <div className="mb-4">
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Description</label>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="Share the details. Use **bold**, *italic*, [links](url), headings, lists..."
              minHeight={180}
              maxLength={10000}
            />
          </div>

          {/* Media */}
          {(images.length > 0 || video) && (
            <div className="mb-4">
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                Media ({images.length}{video ? ' + video' : ''})
              </label>
              <div className="grid grid-cols-4 gap-2">
                {images.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-black/40 group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImages(prev => prev.filter((_, x) => x !== i))}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
                {video && (
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-black/40 group col-span-2">
                    <video src={video} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-[11px] font-semibold uppercase tracking-wider">VIDEO</div>
                    <button
                      onClick={() => setVideo(null)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                      <X size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="mb-4">
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2 block">Attachments</label>
              <div className="space-y-1.5">
                {attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg group">
                    <Paperclip size={13} className="text-white/40 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white truncate">{a.name}</p>
                      <p className="text-[11px] text-white/40">{formatBytes(a.size)}</p>
                    </div>
                    <button
                      onClick={() => setAttachments(prev => prev.filter((_, x) => x !== i))}
                      className="text-white/40 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advanced */}
          <div className="mt-2 border-t border-white/[0.06] pt-4">
            <button
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="w-full flex items-center justify-between text-[12px] font-semibold text-white/60 hover:text-white uppercase tracking-wider"
            >
              <span>Advanced options</span>
              <CaretDown size={12} className={'transition-transform ' + (advancedOpen ? 'rotate-180' : '')} />
            </button>

            {advancedOpen && (
              <div className="mt-4 space-y-4">

                {/* Milestone */}
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={milestoneEnabled}
                      onChange={(e) => setMilestoneEnabled(e.target.checked)}
                      className="w-4 h-4 accent-white mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <Flag size={13} className="text-purple-300" />
                        <span className="text-[13px] font-semibold text-white">Mark as milestone</span>
                      </div>
                      <p className="text-[12px] text-white/50 mt-0.5">
                        Setting this will also update your project stage automatically and add it to your development history.
                      </p>
                    </div>
                  </label>

                  {milestoneEnabled && (
                    <div className="mt-3 flex items-center gap-2 pl-7">
                      <span className="text-[13px] text-white/60">From</span>
                      <span className="text-[13px] font-semibold text-white bg-white/[0.06] border border-white/[0.1] px-2.5 py-1 rounded-md">
                        {STAGE_LABELS[currentStage] || currentStage}
                      </span>
                      <span className="text-white/40">→</span>
                      <span className="text-[13px] text-white/60">To</span>
                      <select
                        value={milestoneTo}
                        onChange={(e) => setMilestoneTo(e.target.value)}
                        className="text-[13px] font-semibold text-white bg-white/[0.06] border border-white/[0.15] px-2.5 py-1 rounded-md outline-none focus:border-white/30"
                      >
                        {STAGES.map(s => (
                          <option key={s} value={s} className="bg-[#12121a]">{STAGE_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Resource link */}
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <LinkSimple size={13} className="text-blue-300" />
                    <span className="text-[13px] font-semibold text-white">Attach a link</span>
                    <span className="text-[11px] text-white/40">(GitHub, Figma, Demo, Docs)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-2">
                    <input
                      value={resourceUrl}
                      onChange={(e) => setResourceUrl(e.target.value)}
                      placeholder="https://github.com/..."
                      className="h-9 bg-white/[0.04] border border-white/[0.1] rounded-md px-3 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-white/25"
                    />
                    <input
                      value={resourceLabel}
                      onChange={(e) => setResourceLabel(e.target.value.slice(0, 100))}
                      placeholder="Button label (optional)"
                      className="h-9 bg-white/[0.04] border border-white/[0.1] rounded-md px-3 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-white/25"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Tag size={13} className="text-emerald-300" />
                    <span className="text-[13px] font-semibold text-white">Tags</span>
                    <span className="text-[11px] text-white/40">({tags.length}/10)</span>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {tags.map(t => (
                        <span key={t} className="inline-flex items-center gap-1 bg-white/[0.06] border border-white/[0.15] rounded-md px-2 py-0.5 text-[12px] text-white">
                          #{t}
                          <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="text-white/50 hover:text-white">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {tags.length < 10 && (
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
                      placeholder="Type a tag and press Enter"
                      className="w-full h-8 bg-white/[0.04] border border-white/[0.1] rounded-md px-3 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-white/25"
                    />
                  )}
                </div>

                {/* Comments disabled */}
                <label className="flex items-start gap-3 cursor-pointer bg-white/[0.02] border border-white/[0.08] rounded-lg p-4">
                  <input
                    type="checkbox"
                    checked={commentsDisabled}
                    onChange={(e) => setCommentsDisabled(e.target.checked)}
                    className="w-4 h-4 accent-white mt-0.5"
                  />
                  <div>
                    <span className="text-[13px] font-semibold text-white">Disable comments</span>
                    <p className="text-[12px] text-white/50 mt-0.5">People won't be able to comment on this update.</p>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-6 py-3 flex-shrink-0 bg-[#0f0f18]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={images.length >= 8 || uploadingImage}
                className="w-9 h-9 rounded-md text-white/60 hover:text-white hover:bg-white/[0.06] flex items-center justify-center disabled:opacity-30"
                title="Add image"
              >
                {uploadingImage ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : <ImageIcon size={16} />}
              </button>
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={!!video || uploadingVideo}
                className="w-9 h-9 rounded-md text-white/60 hover:text-white hover:bg-white/[0.06] flex items-center justify-center disabled:opacity-30"
                title="Add video"
              >
                {uploadingVideo ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : <VideoCamera size={16} />}
              </button>
              <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleVideoSelect} />

              <button
                onClick={() => attachInputRef.current?.click()}
                disabled={attachments.length >= 5 || uploadingAttachment}
                className="w-9 h-9 rounded-md text-white/60 hover:text-white hover:bg-white/[0.06] flex items-center justify-center disabled:opacity-30"
                title="Attach file"
              >
                {uploadingAttachment ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : <Paperclip size={16} />}
              </button>
              <input ref={attachInputRef} type="file" className="hidden" onChange={handleAttachmentSelect} />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                disabled={posting}
                className="px-4 h-9 text-[13px] text-white/70 hover:text-white border border-white/[0.1] rounded-md hover:bg-white/[0.04] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!canPost}
                className="px-5 h-9 text-[13px] font-semibold bg-white text-black hover:bg-white/90 rounded-md disabled:opacity-40 flex items-center gap-1.5"
              >
                {posting ? (
                  <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" /> Posting</>
                ) : (
                  <><selectedType.icon size={13} weight="fill" /> Post {selectedType.label}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {cropperSrc && (
        <ImageCropperModal
          imageSrc={cropperSrc}
          aspect={16 / 9}
          onCancel={() => setCropperSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  )
}
