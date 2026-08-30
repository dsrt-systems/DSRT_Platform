'use client'

import { ArrowLeft, ArrowRight, CircleNotch, Rocket } from '@phosphor-icons/react'
import { ProjectStepKey } from '@/stores/projectCreationStore'

interface Props {
  currentStep: ProjectStepKey
  isSaving: boolean
  canContinue: boolean
  onBack: () => void
  onContinue: () => void
  onPublish?: () => void
}

export function ProjectCreationFooter({
  currentStep, isSaving, canContinue, onBack, onContinue, onPublish
}: Props) {
  const isFirst = currentStep === 'identity'
  const isLast = currentStep === 'publish'

  return (
    <div className="flex items-center justify-between pt-6 border-t border-white/[0.06] mt-10">
      <button
        onClick={onBack}
        disabled={isFirst || isSaving}
        className="flex items-center gap-1.5 h-10 px-4 text-[13px] font-semibold text-zinc-400 hover:text-white transition-colors disabled:opacity-0"
      >
        <ArrowLeft size={14} weight="bold" /> Back
      </button>

      {isLast ? (
        <button
          onClick={onPublish}
          disabled={!canContinue || isSaving}
          className="flex items-center gap-2 h-10 px-6 rounded-lg bg-white text-black hover:bg-zinc-200 text-[13px] font-bold transition-all disabled:opacity-50"
        >
          {isSaving ? <CircleNotch size={14} className="animate-spin" /> : <Rocket size={14} weight="fill" />}
          Publish Project
        </button>
      ) : (
        <button
          onClick={onContinue}
          disabled={!canContinue || isSaving}
          className="flex items-center gap-1.5 h-10 px-6 rounded-lg bg-white text-black hover:bg-zinc-200 text-[13px] font-bold transition-all disabled:opacity-50"
        >
          {isSaving ? <CircleNotch size={14} className="animate-spin" /> : 'Continue'}
          {!isSaving && <ArrowRight size={14} weight="bold" />}
        </button>
      )}
    </div>
  )
}