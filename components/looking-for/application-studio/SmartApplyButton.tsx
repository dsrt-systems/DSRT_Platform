'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PaperPlaneTilt,
  CheckCircle,
  LockKey,
  PencilSimple,
  CircleNotch,
  ArrowRight,
} from '@phosphor-icons/react'
import { ApplicationBriefModal } from './ApplicationBriefModal'

export function SmartApplyButton({
  opportunity,
  isOwner,
  isClosed,
  className,
}: {
  opportunity: any
  isOwner: boolean
  isClosed: boolean
  className?: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [showBrief, setShowBrief] = useState(false)

  const app = opportunity.application
  const stage = app?.pipeline_stage

  const isDraft = stage === 'draft'
  const isWithdrawn = stage === 'withdrawn'
  const isSubmitted = !!app && stage !== 'draft' && stage !== 'withdrawn'

  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap disabled:opacity-60'

  const sizeDefault = 'h-11 px-5'

  const handleApplyClick = () => {
    if (isDraft && app?.id) {
      setBusy(true)
      router.push(`/looking-for/${opportunity.id}/apply/${app.id}`)
      return
    }
    setShowBrief(true)
  }

  if (isOwner) {
    return (
      <button
        onClick={() => router.push(`/looking-for/create-v2/${opportunity.id}`)}
        className={`${base} ${className || `${sizeDefault} w-full`} bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800`}
      >
        <PencilSimple size={14} /> Edit Opportunity
      </button>
    )
  }

  if (isSubmitted) {
    return (
      <button
        onClick={() => router.push(`/looking-for/my-applications?app=${app.id}`)}
        className={`${base} ${className || `${sizeDefault} w-full`} border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20`}
      >
        <CheckCircle size={14} weight="fill" />
        <span className="truncate">Application Submitted</span>
        <ArrowRight size={11} weight="bold" />
      </button>
    )
  }

  if (isClosed) {
    return (
      <button
        disabled
        className={`${base} ${className || `${sizeDefault} w-full`} bg-zinc-950 border border-zinc-800 text-zinc-500 cursor-not-allowed`}
      >
        <LockKey size={13} weight="fill" /> Applications Closed
      </button>
    )
  }

  if (isDraft) {
    return (
      <button
        onClick={handleApplyClick}
        disabled={busy}
        className={`${base} ${className || `${sizeDefault} w-full`} bg-blue-500 text-white hover:bg-blue-400 shadow-[0_2px_12px_rgba(59,130,246,0.3)]`}
      >
        {busy ? (
          <CircleNotch size={13} className="animate-spin" />
        ) : (
          <PencilSimple size={13} weight="bold" />
        )}
        <span className="truncate">Continue Application</span>
      </button>
    )
  }

  return (
    <>
      <button
        onClick={handleApplyClick}
        disabled={busy}
        className={`${base} ${className || `${sizeDefault} w-full`} bg-white text-black hover:bg-zinc-200 shadow-[0_2px_16px_rgba(255,255,255,0.15)] active:scale-[0.98]`}
      >
        {busy ? (
          <CircleNotch size={13} className="animate-spin" />
        ) : (
          <PaperPlaneTilt size={13} weight="bold" />
        )}
        {isWithdrawn ? 'Apply Again' : 'Apply Now'}
      </button>

      {showBrief && (
        <ApplicationBriefModal
          opportunityId={opportunity.id}
          onClose={() => setShowBrief(false)}
        />
      )}
    </>
  )
}