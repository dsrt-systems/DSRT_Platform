'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Camera, CheckCircle, Spinner, User } from '@phosphor-icons/react'
import { ImageCropperModal } from '../shared/ImageCropperModal'
import { cn } from '@/lib/utils'

interface AvatarSectionProps {
  avatarUrl: string | null
  fullName: string
  isVerified: boolean
  isOwner: boolean
  onAvatarChange: (newUrl: string) => void
}

export function AvatarSection({
  avatarUrl,
  fullName,
  isVerified,
  isOwner,
  onAvatarChange,
}: AvatarSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [cropperSrc, setCropperSrc] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const initials = fullName
    ? fullName.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : '?'

  const handleEditClick = () => fileInputRef.current?.click()

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error('Image must be under 6MB')
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
    formData.append('file', blob, 'avatar.jpg')
    try {
      const res = await fetch('/api/profile/avatar-upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error || 'Upload failed')
      }
      const data = await res.json()
      onAvatarChange(data.url)
      toast.success('Avatar updated')
      setCropperOpen(false)
      setCropperSrc(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div className="relative inline-block group">
        {/* Avatar circle */}
        <div
          className={cn(
            'w-36 h-36 rounded-full overflow-hidden bg-zinc-900',
            'border-4 border-[#0a0a0b] shadow-xl ring-1 ring-zinc-800/60',
            'relative',
          )}
        >
          {/* Image — always fully visible */}
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={fullName || 'Avatar'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900">
              {fullName ? (
                <span className="text-4xl font-bold text-zinc-300">{initials}</span>
              ) : (
                <User className="w-16 h-16 text-zinc-600" weight="duotone" />
              )}
            </div>
          )}

          {/* Hover overlay — pure CSS, NO framer-motion opacity conflict.
              Default: opacity-0 (invisible).
              On group-hover: opacity-100 (visible).
              Only for owner, and only when not uploading. */}
          {isOwner && !uploading && (
            <button
              type="button"
              onClick={handleEditClick}
              className={cn(
                'absolute inset-0 flex flex-col items-center justify-center gap-1',
                'bg-black/55 backdrop-blur-[2px]',
                'opacity-0 group-hover:opacity-100',
                'transition-opacity duration-200',
                'cursor-pointer',
              )}
              aria-label="Edit photo"
            >
              <Camera className="w-6 h-6 text-white" weight="bold" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                Edit Photo
              </span>
            </button>
          )}

          {/* Uploading overlay — only while uploading */}
          {isOwner && uploading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <Spinner className="w-6 h-6 text-white animate-spin" weight="bold" />
            </div>
          )}
        </div>

        {/* Camera badge — always visible for owner */}
        {isOwner && !uploading && (
          <button
            type="button"
            onClick={handleEditClick}
            className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white text-black flex items-center justify-center border-2 border-[#0a0a0b] shadow-lg hover:bg-zinc-100 hover:scale-110 transition-all z-10"
            title="Edit avatar"
          >
            <Camera className="w-4 h-4" weight="bold" />
          </button>
        )}

        {/* Verified badge for visitors */}
        {isVerified && !isOwner && (
          <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center border-2 border-[#0a0a0b] shadow-lg">
            <CheckCircle className="w-4 h-4" weight="fill" />
          </div>
        )}

        {isOwner && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelected}
          />
        )}
      </div>

      {cropperOpen && cropperSrc && (
        <ImageCropperModal
          imageSrc={cropperSrc}
          aspectRatio={1}
          shape="round"
          title="Edit Profile Photo"
          onSave={handleCropSave}
          onCancel={() => {
            setCropperOpen(false)
            setCropperSrc(null)
          }}
        />
      )}
    </>
  )
}