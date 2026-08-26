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
import { ApplicationBriefModal } from './ApplicationBriefModal' // IMPORT MODAL

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
  const [showBrief, setShowBrief] = useState(false) // NEW STATE

  const app = opportunity.application
  const stage = app?.pipeline_stage

  const isDraft = stage === 'draft'
  const isWithdrawn = stage === 'withdrawn'
  const isSubmitted = !!app && stage !== 'draft' && stage !== 'withdrawn'

  const handleApplyClick = () => {
    // If they already have a draft, send them straight to the studio
    if (isDraft && app?.id) {
      setBusy(true)
      router.push(`/looking-for/${opportunity.id}/apply/${app.id}`)
      return
    }
    
    // Show the prep modal for fresh applications or withdrawn retries
    setShowBrief(true)
  }

  // State 1: Owner
  if (isOwner) {
    return (
      <button
        onClick={() => router.push(`/looking-for/create-v2/${opportunity.id}`)}
        className={`inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-[13px] font-semibold transition-colors ${className || 'w-full'}`}
      >
        <PencilSimple size={14} /> Edit Opportunity
      </button>
    )
  }

  // State 2: Already submitted successfully
  if (isSubmitted) {
    return (
      <button
        onClick={() => router.push(`/looking-for/my-applications?app=${app.id}`)}
        className={`inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[13px] font-bold hover:bg-emerald-500/20 transition-colors shadow-[inset_0_1px_0_rgba(16,185,129,0.1)] ${className || 'w-full'}`}
      >
        <CheckCircle size={15} weight="fill" />
        Application Submitted
        <ArrowRight size={12} weight="bold" className="ml-1" />
      </button>
    )
  }

  // State 3: Closed or deadline passed
  if (isClosed) {
    return (
      <button
        disabled
        className={`inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 text-[13px] font-semibold cursor-not-allowed ${className || 'w-full'}`}
      >
        <LockKey size={14} weight="fill" /> Applications Closed
      </button>
    )
  }

  // State 4: Has a draft in progress
  if (isDraft) {
    return (
      <button
        onClick={handleApplyClick}
        disabled={busy}
        className={`inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-blue-500 text-white hover:bg-blue-400 text-[13px] font-bold transition-all shadow-[0_2px_12px_rgba(59,130,246,0.3)] disabled:opacity-60 ${className || 'w-full'}`}
      >
        {busy ? <CircleNotch size={14} className="animate-spin" /> : <PencilSimple size={15} weight="bold" />}
        Continue Application
      </button>
    )
  }

  // State 5: Fresh applicant
  return (
    <>
      <button
        onClick={handleApplyClick}
        disabled={busy}
        className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-white text-black hover:bg-zinc-200 text-[13px] font-bold transition-all shadow-[0_2px_16px_rgba(255,255,255,0.15)] active:scale-[0.98] disabled:opacity-60 ${className || 'w-full'}`}
      >
        {busy ? <CircleNotch size={14} className="animate-spin" /> : <PaperPlaneTilt size={15} weight="bold" />}
        {isWithdrawn ? 'Apply Again' : 'Apply Now'}
      </button>

      {/* RENDER MODAL */}
      {showBrief && (
        <ApplicationBriefModal
          opportunityId={opportunity.id}
          onClose={() => setShowBrief(false)}
        />
      )}
    </>
  )
}