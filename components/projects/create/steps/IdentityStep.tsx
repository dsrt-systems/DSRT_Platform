'use client'

import { useRef, useState } from 'react'
import { Image as ImageIcon, Upload, X, CircleNotch } from '@phosphor-icons/react'
import { useProjectCreationStore } from '@/stores/projectCreationStore'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const PROJECT_TYPES = [
  { id: 'software', label: 'Software' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'research', label: 'Research' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'open-source', label: 'Open Source' },
  { id: 'academic', label: 'Academic' },
  { id: 'design', label: 'Design' },
  { id: 'creative', label: 'Creative' },
  { id: 'experiment', label: 'Experiment' },
  { id: 'community', label: 'Community' },
  { id: 'other', label: 'Other' },
]

export function IdentityStep() {
  const { data, updateData } = useProjectCreationStore()
  const supabase = createClient()

  const coverInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'cover_image_url' | 'logo_url',
    setLoading: (s: boolean) => void
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const namespace = data.id || user.id
      const filename = `${namespace}/${type}-${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('projects')
        .upload(filename, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('projects').getPublicUrl(filename)

      updateData({ [type]: publicUrl })
      toast.success('Image uploaded')
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Name */}
      <div className="space-y-2">
        <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider flex items-center justify-between">
          <span>Project Name *</span>
          <span className="text-white/30 font-mono text-[10px]">
            {data.name?.length || 0}/80
          </span>
        </label>
        <input
          autoFocus
          value={data.name || ''}
          onChange={e => updateData({ name: e.target.value })}
          placeholder="e.g. NILM Fault Detection"
          maxLength={80}
          className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] focus:border-white/30 focus:bg-white/[0.05] text-[15px] text-white placeholder:text-white/20 outline-none transition-all"
        />
        <p className="text-[12px] text-zinc-500 mt-1">
          Use a name people can remember and search for.
        </p>
      </div>

      {/* Primary Type */}
      <div className="space-y-3">
        <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider block">
          Primary Project Type *
        </label>
        <div className="flex flex-wrap gap-2">
          {PROJECT_TYPES.map(t => {
            const active = data.project_type === t.id
            return (
              <button
                key={t.id}
                onClick={() => updateData({ project_type: t.id })}
                className={`px-4 h-10 rounded-lg text-[13px] font-semibold transition-all border ${
                  active
                    ? 'bg-white text-black border-white'
                    : 'bg-white/[0.02] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tagline */}
      <div className="space-y-2">
        <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider flex items-center justify-between">
          <span>Short Tagline *</span>
          <span className="text-white/30 font-mono text-[10px]">
            {data.tagline?.length || 0}/160
          </span>
        </label>
        <textarea
          value={data.tagline || ''}
          onChange={e => updateData({ tagline: e.target.value })}
          placeholder="Describe your project in one sentence."
          maxLength={160}
          rows={2}
          className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] focus:border-white/30 focus:bg-white/[0.05] text-[14px] text-white placeholder:text-white/20 outline-none resize-none transition-all leading-relaxed"
        />
      </div>

      {/* Images */}
      <div className="pt-4 border-t border-white/[0.06] space-y-6">
        <div>
          <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider block mb-3">
            Project Visuals (Optional)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Cover */}
            <div className="space-y-2">
              <p className="text-[12.5px] font-medium text-white/80">Project Cover (16:9)</p>
              <div
                onClick={() => coverInputRef.current?.click()}
                className="w-full aspect-[16/9] rounded-xl border border-dashed border-white/[0.15] hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group"
              >
                {data.cover_image_url ? (
                  <>
                    <img src={data.cover_image_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[12px] font-semibold text-white">Change cover</span>
                    </div>
                  </>
                ) : uploadingCover ? (
                  <CircleNotch size={24} className="text-white/40 animate-spin" />
                ) : (
                  <>
                    <ImageIcon size={24} className="text-white/30 mb-2" />
                    <span className="text-[12px] font-semibold text-white/50">Add cover image</span>
                  </>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleFileUpload(e, 'cover_image_url', setUploadingCover)}
                />
              </div>
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <p className="text-[12.5px] font-medium text-white/80">Project Logo</p>
              <div className="flex items-start gap-4">
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="w-[100px] h-[100px] rounded-2xl border border-dashed border-white/[0.15] hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group shrink-0"
                >
                  {data.logo_url ? (
                    <>
                      <img src={data.logo_url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[11px] font-semibold text-white">Change</span>
                      </div>
                    </>
                  ) : uploadingLogo ? (
                    <CircleNotch size={20} className="text-white/40 animate-spin" />
                  ) : (
                    <Upload size={20} className="text-white/30" />
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFileUpload(e, 'logo_url', setUploadingLogo)}
                  />
                </div>
                <div className="pt-2">
                  <p className="text-[11.5px] text-zinc-500 leading-relaxed">
                    Square avatar used across DSRT. If skipped, we generate a fallback icon.
                  </p>
                  {data.logo_url && (
                    <button
                      onClick={() => updateData({ logo_url: null })}
                      className="text-[11.5px] text-red-400 hover:text-red-300 font-semibold mt-2"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}