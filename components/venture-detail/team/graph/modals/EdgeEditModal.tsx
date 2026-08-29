'use client'

import { useState } from 'react'
import { X, CircleNotch, Trash } from '@phosphor-icons/react'
import { RELATIONSHIP_TYPES, type RelationshipType } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  currentType: RelationshipType
  onUpdate: (newType: RelationshipType) => Promise<void>
  onDelete: () => Promise<void>
}

export function EdgeEditModal({ open, onClose, currentType, onUpdate, onDelete }: Props) {
  const [selected, setSelected] = useState<RelationshipType>(currentType)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!open) return null

  const handleUpdate = async () => {
    if (selected === currentType) {
      onClose()
      return
    }
    setSaving(true)
    await onUpdate(selected)
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Remove this relationship? The organizational structure will update immediately.')) return
    setDeleting(true)
    await onDelete()
    setDeleting(false)
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#121215] border border-white/[0.1] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-white">Edit Relationship</h3>
          <button onClick={onClose} disabled={saving || deleting} className="text-zinc-500 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-1.5 max-h-[400px] overflow-y-auto">
          {RELATIONSHIP_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setSelected(type.value)}
              className={
                'w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left ' +
                (selected === type.value
                  ? 'border-white/20 bg-white/[0.05]'
                  : 'border-transparent hover:bg-white/[0.02]')
              }
            >
              <div
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: type.color }}
              />
              <div className="flex-1 min-w-0">
                <p className={
                  'text-[13px] font-semibold ' +
                  (selected === type.value ? 'text-white' : 'text-zinc-300')
                }>
                  {type.label}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{type.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between gap-2">
          <button
            onClick={handleDelete}
            disabled={saving || deleting}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[12px] font-semibold text-red-300 transition-colors disabled:opacity-50"
          >
            {deleting ? <CircleNotch size={12} className="animate-spin" /> : <Trash size={12} weight="bold" />}
            Remove
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={saving || deleting}
              className="px-4 h-9 text-[12.5px] font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={saving || deleting || selected === currentType}
              className="inline-flex items-center gap-1.5 px-5 h-9 bg-white text-black rounded-lg text-[12.5px] font-bold hover:bg-zinc-200 disabled:opacity-50"
            >
              {saving ? <CircleNotch size={13} className="animate-spin" /> : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}