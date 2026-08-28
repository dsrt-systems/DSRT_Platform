'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Trash, CircleNotch } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Props {
  ventureId: string
  ventureName?: string
  currentUrl?: string | null
  onChange: (url: string | null) => void
}

export function LogoUploader({ ventureId, ventureName, currentUrl, onChange }: Props) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be under 5MB')
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${ventureId}/logo-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('ventures').upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('ventures').getPublicUrl(path)
      onChange(publicUrl)
      toast.success('Logo uploaded')
    } catch (e: any) {
      toast.error(e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />

      <div className="relative">
        <div className="w-20 h-20 rounded-xl bg-[#121215] border border-zinc-800 overflow-hidden flex items-center justify-center">
          {currentUrl ? (
            <img src={currentUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-zinc-500">
              {ventureName?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        {uploading && (
          <div className="absolute inset-0 rounded-xl bg-black/70 flex items-center justify-center">
            <CircleNotch size={16} className="animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-semibold bg-[#121215] border border-zinc-800 hover:border-zinc-600 text-zinc-200 rounded-md transition-colors disabled:opacity-50"
        >
          <Camera size={12} />
          {currentUrl ? 'Change logo' : 'Upload logo'}
        </button>
        {currentUrl && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1.5 h-7 px-2 text-[11px] text-zinc-500 hover:text-red-400 transition-colors"
          >
            <Trash size={11} /> Remove
          </button>
        )}
        <p className="text-[10.5px] text-zinc-600 mt-1">Square image · Max 5MB · JPG, PNG, WEBP</p>
      </div>
    </div>
  )
}