'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PencilSimple, VideoCamera, Image as ImageIcon, Plus, Trash, Check } from '@phosphor-icons/react'
import { MarkdownEditor } from './MarkdownEditor'
import { ImageCropperModal } from './ImageCropperModal'

interface ProjectImage {
  id: string
  url: string
  caption: string | null
  type: string
  position: number
}

interface Props {
  slug: string
  aboutContent: string | null
  images: ProjectImage[]
  isOwner: boolean
  onSaveAbout: (content: string) => Promise<void>
  onAddImage: (url: string, type: string) => Promise<void>
  onDeleteImage: (id: string) => Promise<void>
  onUploadFile: (file: File, kind: 'gallery') => Promise<string | null>
}

const MAX_IMAGES = 2
const MAX_VIDEOS = 1

export function ProjectAbout({
  slug, aboutContent, images, isOwner,
  onSaveAbout, onAddImage, onDeleteImage, onUploadFile
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(aboutContent || '')
  const [saving, setSaving] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [cropperSrc, setCropperSrc] = useState<string | null>(null)

  useEffect(() => { setDraft(aboutContent || '') }, [aboutContent])

  const imageCount = images.filter(i => i.type === 'image').length
  const videoCount = images.filter(i => i.type === 'video').length

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSaveAbout(draft)
      setEditing(false)
    } finally { setSaving(false) }
  }

  const handleCancel = () => {
    setDraft(aboutContent || '')
    setEditing(false)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (imageCount >= MAX_IMAGES) { alert('Max ' + MAX_IMAGES + ' images'); e.target.value=''; return }
    const reader = new FileReader()
    reader.onload = () => setCropperSrc(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropConfirm = async (blob: Blob) => {
    const file = new File([blob], 'gallery.jpg', { type: 'image/jpeg' })
    const url = await onUploadFile(file, 'gallery')
    if (url) await onAddImage(url, 'image')
    setCropperSrc(null)
  }

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (videoCount >= MAX_VIDEOS) { alert('Max ' + MAX_VIDEOS + ' video'); e.target.value=''; return }
    if (file.size > 50 * 1024 * 1024) { alert('Video too large (max 50MB)'); e.target.value=''; return }
    const url = await onUploadFile(file, 'gallery')
    if (url) await onAddImage(url, 'video')
    e.target.value = ''
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden mb-5">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <h2 className="text-[18px] font-semibold text-white">About the project</h2>
        {isOwner && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-[13px] font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] px-3 h-8 rounded-md transition-colors"
          >
            <PencilSimple size={13} /> Edit
          </button>
        )}
      </div>

      <div className="p-6">
        {editing ? (
          <>
            <MarkdownEditor
              value={draft}
              onChange={setDraft}
              placeholder="Describe your project in detail. What problem does it solve? Who is it for? What makes it different?"
              minHeight={240}
              maxLength={10000}
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 h-9 text-[13px] text-white/70 hover:text-white border border-white/[0.1] rounded-md hover:bg-white/[0.04] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 h-9 text-[13px] font-semibold bg-white text-black hover:bg-white/90 rounded-md disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? (
                  <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" /> Saving</>
                ) : (<><Check size={13} weight="bold" /> Save</>)}
              </button>
            </div>
          </>
        ) : aboutContent ? (
          <div className="prose prose-invert prose-sm max-w-none text-[14px] text-white/85 leading-relaxed prose-headings:text-white prose-headings:font-semibold prose-a:text-purple-300 prose-strong:text-white prose-code:text-purple-200 prose-code:bg-white/[0.06] prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{aboutContent}</ReactMarkdown>
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-[14px] text-white/50 mb-2">
              {isOwner ? 'No description yet.' : 'This project has no description yet.'}
            </p>
            {isOwner && (
              <button
                onClick={() => setEditing(true)}
                className="text-[13px] font-medium text-white/85 hover:text-white underline underline-offset-2"
              >
                Add a description
              </button>
            )}
          </div>
        )}

        {/* Media gallery */}
        {(images.length > 0 || isOwner) && (
          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-semibold text-white/50 uppercase tracking-wider">Media</h3>
              {isOwner && (
                <div className="flex items-center gap-1.5">
                  {imageCount < MAX_IMAGES && (
                    <>
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="flex items-center gap-1 text-[12px] text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] px-2.5 h-7 rounded-md transition-colors"
                      >
                        <Plus size={11} weight="bold" /> Image
                      </button>
                      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    </>
                  )}
                  {videoCount < MAX_VIDEOS && (
                    <>
                      <button
                        onClick={() => videoInputRef.current?.click()}
                        className="flex items-center gap-1 text-[12px] text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] px-2.5 h-7 rounded-md transition-colors"
                      >
                        <Plus size={11} weight="bold" /> Video
                      </button>
                      <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleVideoSelect} />
                    </>
                  )}
                </div>
              )}
            </div>

            {images.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-white/35 border border-dashed border-white/[0.08] rounded-lg">
                {isOwner ? 'Add up to 2 images and 1 video' : 'No media added'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {images.map((img) => (
                  <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden bg-black/40 group border border-white/[0.06]">
                    {img.type === 'video' ? (
                      <video src={img.url} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    )}
                    {isOwner && (
                      <button
                        onClick={() => onDeleteImage(img.id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash size={12} />
                      </button>
                    )}
                    {img.type === 'video' && (
                      <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-semibold text-white flex items-center gap-1 uppercase tracking-wider">
                        <VideoCamera size={10} weight="fill" /> Video
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
