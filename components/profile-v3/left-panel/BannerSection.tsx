'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, PencilSimple, Spinner } from '@phosphor-icons/react'
import { ImageCropperModal } from '../shared/ImageCropperModal'

interface BannerSectionProps {
  bannerUrl: string | null
  isOwner: boolean
  onBannerChange: (newUrl: string) => void
}

// Wide banner: 5:1 desktop, taller ratio on mobile via responsive classes
const BANNER_ASPECT = 5 / 1

export function BannerSection({
  bannerUrl,
  isOwner,
  onBannerChange,
}: BannerSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [cropperSrc, setCropperSrc] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleEditClick = () => fileInputRef.current?.click()

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error('Image must be under 12MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setCropperSrc(reader.result as string)
      setCropperOpen(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropSave = async (blob: Blob) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', blob, 'banner.jpg')
    try {
      const res = await fetch('/api/profile/banner-upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error || 'Upload failed')
      }
      const data = await res.json()
      onBannerChange(data.url)
      toast.success('Banner updated')
      setCropperOpen(false)
      setCropperSrc(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload banner')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {/* Full-width banner container.
          Responsive heights:
            - Mobile (<sm): h-40 (~160px)
            - Small (sm+):  h-48 (~192px)
            - Medium (md+): h-56 (~224px)
            - Large (lg+):  h-64 (~256px)
            - XL (xl+):     h-72 (~288px)
      */}
      <div className="relative w-full h-40 sm:h-48 md:h-56 lg:h-64 xl:h-72 overflow-hidden bg-zinc-900 group border-b border-zinc-800/60">
        {bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bannerUrl} alt="Profile banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{
            background: 'linear-gradient(135deg, #18181b 0%, #27272a 40%, #1c1917 100%)',
          }} />
        )}

        {/* Subtle bottom fade for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />

        {isOwner && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelected}
            />

            <AnimatePresence>
              {uploading ? (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
                >
                  <div className="flex items-center gap-2.5 bg-zinc-900/90 border border-zinc-700 rounded-full px-4 py-2">
                    <Spinner className="w-4 h-4 text-white animate-spin" weight="bold" />
                    <span className="text-[12px] font-semibold text-zinc-200">Uploading...</span>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="edit-btn"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={handleEditClick}
                  className="absolute top-3 right-3 md:top-4 md:right-4 flex items-center gap-1.5 h-8 px-3 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                >
                  <PencilSimple className="w-3.5 h-3.5" weight="bold" />
                  Edit Banner
                </motion.button>
              )}
            </AnimatePresence>

            {!bannerUrl && (
              <button
                onClick={handleEditClick}
                className="absolute inset-0 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                  <Camera className="w-4 h-4 text-white" weight="bold" />
                  <span className="text-[12px] font-semibold text-white">Add a banner</span>
                </div>
              </button>
            )}
          </>
        )}
      </div>

      {cropperOpen && cropperSrc && (
        <ImageCropperModal
          imageSrc={cropperSrc}
          aspectRatio={BANNER_ASPECT}
          shape="rect"
          title="Edit Banner"
          onSave={handleCropSave}
          onCancel={() => { setCropperOpen(false); setCropperSrc(null) }}
        />
      )}
    </>
  )
}