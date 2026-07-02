'use client'

import { useState } from 'react'
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
import { Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadImageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'avatar' | 'cover'
  userId: string
  currentUrl: string | null
}

export function UploadImageModal({
  open,
  onOpenChange,
  type,
  userId,
  currentUrl,
}: UploadImageModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: type === 'avatar' ? 5 * 1024 * 1024 : 10 * 1024 * 1024,
    onDrop: (files) => {
      const f = files[0]
      if (f) {
        setFile(f)
        setPreview(URL.createObjectURL(f))
      }
    },
  })

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${userId}/${type}-${Date.now()}.${ext}`
    const bucket = type === 'avatar' ? 'avatars' : 'covers'

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: true })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      alert('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path)

    const fieldName = type === 'avatar' ? 'avatar_url' : 'cover_url'

    await supabase
      .from('users')
      .update({ [fieldName]: publicUrl })
      .eq('id', userId)

    router.refresh()
    setUploading(false)
    onOpenChange(false)
    setFile(null)
    setPreview(null)
  }

  const handleRemove = async () => {
    setUploading(true)
    const fieldName = type === 'avatar' ? 'avatar_url' : 'cover_url'
    await supabase.from('users').update({ [fieldName]: null }).eq('id', userId)
    router.refresh()
    setUploading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Update {type === 'avatar' ? 'Profile Photo' : 'Cover Image'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className={cn(
                  'w-full object-cover rounded-lg',
                  type === 'avatar' ? 'h-48' : 'h-32'
                )}
              />
              <button
                onClick={() => {
                  setFile(null)
                  setPreview(null)
                }}
                className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm p-1.5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">
                {isDragActive ? 'Drop image here' : 'Drop image or click to upload'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max {type === 'avatar' ? '5MB' : '10MB'}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {currentUrl && (
              <Button
                variant="outline"
                onClick={handleRemove}
                disabled={uploading}
              >
                Remove
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1"
            >
              {uploading ? 'Uploading...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}