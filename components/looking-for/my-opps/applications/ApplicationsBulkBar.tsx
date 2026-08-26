'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, ChatCircle, PauseCircle, ArrowsClockwise, Star, X } from '@phosphor-icons/react'

const STAGE_OPTIONS = [
  { key: 'under-review', label: 'Move to Reviewing', Icon: PauseCircle },
  { key: 'shortlisted',  label: 'Shortlist',          Icon: CheckCircle },
  { key: 'interview',    label: 'Move to Interview',  Icon: ChatCircle },
  { key: 'accepted',     label: 'Select',             Icon: CheckCircle },
  { key: 'declined',     label: 'Reject',             Icon: XCircle },
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
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-zinc-800 bg-[#0c0c0e]/95 backdrop-blur-md px-2.5 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        <div className="px-2 text-[12px] text-zinc-300 font-semibold">
          {selectedIds.length} selected
        </div>
        <div className="h-5 w-px bg-zinc-800 mx-1" />

        {STAGE_OPTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => {
              if (s.key === 'declined' && !confirm(`Reject ${selectedIds.length} applicant(s)?`)) return
              run({ action: 'set_stage', stage: s.key }, s.key)
            }}
            disabled={!!busy}
            className={
              'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[12px] font-semibold transition-colors disabled:opacity-60 ' +
              (s.key === 'declined'
                ? 'border-red-500/30 text-red-300 hover:bg-red-500/10'
                : 'border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600')
            }
          >
            {busy === s.key
              ? <span className="w-3 h-3 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
              : <s.Icon size={12} weight="regular" />}
            {s.label}
          </button>
        ))}

        <div className="h-5 w-px bg-zinc-800 mx-1" />

        <button
          onClick={() => run({ action: 'star', value: true }, 'star')}
          disabled={!!busy}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-zinc-800 text-[12px] font-semibold text-zinc-300 hover:text-white hover:border-zinc-600"
        >
          <Star size={12} weight="regular" />
          Star
        </button>
        <button
          onClick={() => run({ action: 'star', value: false }, 'unstar')}
          disabled={!!busy}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-zinc-800 text-[12px] font-semibold text-zinc-300 hover:text-white hover:border-zinc-600"
        >
          <ArrowsClockwise size={12} weight="regular" />
          Unstar
        </button>

        <div className="h-5 w-px bg-zinc-800 mx-1" />
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-semibold text-zinc-400 hover:text-white"
        >
          <X size={11} weight="bold" />
          Clear
        </button>
      </div>
    </div>
  )
}