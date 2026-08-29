'use client'

import { useState } from 'react'
import { X, CircleNotch, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  slug: string
  asset: any
  onSuccess: () => void
}

export function MediaEditorModal({ open, onClose, slug, asset, onSuccess }: Props) {
  const [title, setTitle] = useState(asset.title || '')
  const [description, setDescription] = useState(asset.description || '')
  const [altText, setAltText] = useState(asset.alt_text || '')
  const [visibility, setVisibility] = useState(asset.visibility || 'public')
  const [saving, setSaving] = useState(false)

  if (!open || !asset) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/ventures/${slug}/media/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          alt_text: altText.trim() || null,
          visibility,
        })
      })

      if (!res.ok) throw new Error()
      toast.success('Media metadata saved')
      onSuccess()
      onClose()
    } catch {
      toast.error('Failed to update asset')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#121215] border border-white/[0.1] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
          <h2 className="text-[15px] font-bold text-white">Edit Asset Details</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-white mb-1">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full h-10 px-3 bg-[#09090b] border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-white mb-1">Caption / Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 bg-[#09090b] border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-white mb-1">Alt Text (Accessibility)</label>
            <input
              value={altText}
              onChange={e => setAltText(e.target.value)}
              placeholder="Describe image for screen readers"
              className="w-full h-10 px-3 bg-[#09090b] border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-white mb-1">Visibility</label>
            <select
              value={visibility}
              onChange={e => setVisibility(e.target.value)}
              className="w-full h-10 px-3 bg-[#09090b] border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none"
            >
              <option value="public">Public (Visible to everyone)</option>
              <option value="venture_members">Team Only (Members & Founders)</option>
              <option value="creator_only">Private (Only me)</option>
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 h-9 text-[12.5px] font-semibold text-zinc-400 hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 h-9 bg-white text-black rounded-lg text-[12.5px] font-bold hover:bg-zinc-200 disabled:opacity-50"
          >
            {saving ? <CircleNotch size={14} className="animate-spin" /> : <><Check size={14} weight="bold" /> Save Changes</>}
          </button>
        </div>

      </div>
    </div>
  )
}