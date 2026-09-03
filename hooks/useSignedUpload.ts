'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UploadResult {
  file_id: string
  storage_key: string
  storage_bucket: string
  public_url: string
}

export function useSignedUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const upload = async (
    file: File,
    opts?: { entity_type?: string; entity_id?: string; visibility?: 'PRIVATE' | 'PUBLIC' | 'COMMUNITY' }
  ): Promise<UploadResult | null> => {
    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      // 1) Request upload intent (creates signed upload token)
      const intentRes = await fetch('/api/v1/files/upload-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expected_size: file.size,
          expected_mime: file.type || 'application/octet-stream',
          original_name: file.name,
          entity_type: opts?.entity_type ?? 'community_draft',
          entity_id: opts?.entity_id ?? null,
          bucket: 'community-assets',
          visibility: opts?.visibility ?? 'PUBLIC',
        }),
      })
      const intentJson = await intentRes.json()
      if (!intentRes.ok) throw new Error(intentJson?.error?.message || 'Upload intent failed')

      const intent = intentJson?.data
      const bucket = intent?.storage_bucket
      const key = intent?.storage_key
      const token = intent?.token
      if (!bucket || !key || !token) throw new Error('Missing signed upload token')

      // 2) Upload via Supabase storage using the signed token
      const supabase = createClient()
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(key, token, file, {
          upsert: false,
          contentType: file.type || 'application/octet-stream',
        })
      if (upErr) throw new Error(upErr.message)
      setProgress(80)

      // 3) Finalize
      const finalRes = await fetch(`/api/v1/files/${intent.file_id}/finalize`, {
        method: 'POST',
      })
      const finalJson = await finalRes.json()
      if (!finalRes.ok) throw new Error(finalJson?.error?.message || 'Finalize failed')

      // 4) Resolve public URL (public bucket → getPublicUrl)
      const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(key)
      setProgress(100)

      return {
        file_id: intent.file_id,
        storage_bucket: bucket,
        storage_key: key,
        public_url: publicUrl.publicUrl,
      }
    } catch (e: any) {
      setError(e?.message || 'Upload failed')
      return null
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading, progress, error }
}