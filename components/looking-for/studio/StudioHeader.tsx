'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  Eye,
  CheckCircle,
  WarningCircle,
  CircleNotch,
} from '@phosphor-icons/react'
import { useStudio } from './StudioContext'
import { StudioPreview } from './steps/parts/StudioPreview'

export function StudioHeader({ onBack }: { onBack: () => void }) {
  const { draft, saveStatus, lastSavedAt } = useStudio()
  const isPublished = draft.opportunity.status !== 'draft'

  return (
    <div className="sticky top-0 z-30 bg-[#0a0a0b]/95 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 h-[57px] flex items-center gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={12} weight="bold" />
          Looking For
        </button>

        <div className="w-px h-4 bg-zinc-800" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-[14px] font-bold text-white">
              {isPublished ? 'Edit Opportunity' : 'Create Opportunity'}
            </h1>
            {draft.opportunity.opportunity_number && (
              <span className="text-[10.5px] font-mono text-zinc-500">
                {draft.opportunity.opportunity_number}
              </span>
            )}
          </div>
        </div>

        <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
        <PreviewOpener />
      </div>
    </div>
  )
}

function PreviewOpener() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-zinc-800 hover:border-zinc-600 text-[12px] font-semibold text-zinc-300 hover:text-white transition-colors"
      >
        <Eye size={12} />
        Preview
      </button>
      {open && <StudioPreview onClose={() => setOpen(false)} />}
    </>
  )
}

function SaveIndicator({
  status,
  lastSavedAt,
}: {
  status: string
  lastSavedAt: Date | null
}) {
  if (status === 'saving') {
    return (
      <div className="flex items-center gap-1.5 text-[11.5px] text-zinc-400">
        <CircleNotch size={11} className="animate-spin" />
        Saving…
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="flex items-center gap-1.5 text-[11.5px] text-red-300">
        <WarningCircle size={12} weight="fill" />
        Couldn't save
      </div>
    )
  }
  if (status === 'saved' || (status === 'idle' && lastSavedAt)) {
    return (
      <div className="flex items-center gap-1.5 text-[11.5px] text-zinc-500">
        <CheckCircle size={11} weight="fill" className="text-emerald-400" />
        {lastSavedAt ? `Saved ${timeAgo(lastSavedAt)}` : 'Saved'}
      </div>
    )
  }
  return null
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  return `${m}m ago`
}