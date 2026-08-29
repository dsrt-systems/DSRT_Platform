'use client'

import { useState } from 'react'
import { X, CircleNotch } from '@phosphor-icons/react'
import { RELATIONSHIP_TYPES, type RelationshipType } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (type: RelationshipType) => void
  sourceLabel?: string
  targetLabel?: string
}

export function EdgeTypeModal({ open, onClose, onConfirm, sourceLabel, targetLabel }: Props) {
  const [selected, setSelected] = useState<RelationshipType>('reports_to')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const handleConfirm = async () => {
    setSaving(true)
    await onConfirm(selected)
    setSaving(false)
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
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-white">Define Relationship</h3>
            {sourceLabel && targetLabel && (
              <p className="text-[11.5px] text-zinc-400 mt-0.5">
                <span className="text-white font-semibold">{sourceLabel}</span> → <span className="text-white font-semibold">{targetLabel}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} disabled={saving} className="text-zinc-500 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Options */}
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
              {selected === type.value && (
                <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-black" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/40 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 h-9 text-[12.5px] font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 h-9 bg-white text-black rounded-lg text-[12.5px] font-bold hover:bg-zinc-200 disabled:opacity-50"
          >
            {saving ? (
              <><CircleNotch size={13} className="animate-spin" /> Creating…</>
            ) : (
              'Create Relationship'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}