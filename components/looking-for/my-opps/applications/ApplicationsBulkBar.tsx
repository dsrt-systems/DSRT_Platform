'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, ChatCircle, PauseCircle, ArrowsClockwise, Star, X } from '@phosphor-icons/react'

// Standardized exactly to the DB constraint
const STAGE_OPTIONS = [
  { key: 'reviewing',    label: 'Reviewing',   Icon: PauseCircle },
  { key: 'screening',    label: 'Shortlist',   Icon: CheckCircle },
  { key: 'interviewing', label: 'Interview',   Icon: ChatCircle },
  { key: 'hired',        label: 'Select',      Icon: CheckCircle },
  { key: 'rejected',     label: 'Reject',      Icon: XCircle },
]

export function ApplicationsBulkBar({
  selectedIds, onClear, onDone,
}: {
  selectedIds: string[]
  onClear: () => void
  onDone: () => void
}) {
  const [busy, setBusy] = useState<string | null>(null)
  if (selectedIds.length === 0) return null

  const run = async (payload: any, key: string) => {
    setBusy(key)
    try {
      const res = await fetch('/api/opportunities/applications/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_ids: selectedIds, ...payload }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed')
      onClear()
      onDone()
    } catch (e: any) {
      alert(e?.message || 'Bulk action failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="sticky bottom-4 z-30 flex justify-center pointer-events-none">
      <div className="pointer-events-auto flex items-center h-12 rounded-xl border border-zinc-800 bg-[#0c0c0e]/95 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden divide-x divide-zinc-800">
        
        {/* Count */}
        <div className="px-4 text-[12.5px] text-zinc-300 font-semibold flex items-center">
          {selectedIds.length} selected
        </div>

        {/* Stages */}
        <div className="flex items-stretch h-full divide-x divide-zinc-800">
          {STAGE_OPTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => {
                if (s.key === 'rejected' && !confirm(`Reject ${selectedIds.length} applicant(s)?`)) return
                run({ action: 'set_stage', stage: s.key }, s.key)
              }}
              disabled={!!busy}
              className={
                'inline-flex items-center justify-center gap-1.5 px-4 text-[12px] font-semibold transition-colors disabled:opacity-60 h-full ' +
                (s.key === 'rejected'
                  ? 'text-zinc-400 hover:text-red-300 hover:bg-red-500/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50')
              }
            >
              {busy === s.key
                ? <span className="w-3 h-3 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
                : <s.Icon size={14} weight="regular" />}
              {s.label}
            </button>
          ))}
        </div>

        {/* Stars */}
        <div className="flex items-stretch h-full divide-x divide-zinc-800">
          <button
            onClick={() => run({ action: 'star', value: true }, 'star')}
            disabled={!!busy}
            className="inline-flex items-center justify-center gap-1.5 px-4 text-[12px] font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800/50 h-full transition-colors"
          >
            <Star size={14} weight="regular" />
            Star
          </button>
          <button
            onClick={() => run({ action: 'star', value: false }, 'unstar')}
            disabled={!!busy}
            className="inline-flex items-center justify-center gap-1.5 px-4 text-[12px] font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800/50 h-full transition-colors"
          >
            <ArrowsClockwise size={14} weight="regular" />
            Unstar
          </button>
        </div>

        {/* Clear */}
        <button
          onClick={onClear}
          className="inline-flex items-center justify-center gap-1.5 px-4 h-full text-[12px] font-semibold text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-colors"
        >
          <X size={12} weight="bold" />
          Clear
        </button>

      </div>
    </div>
  )
}