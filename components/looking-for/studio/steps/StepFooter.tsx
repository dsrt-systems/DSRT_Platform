'use client'

import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useStudio, type StudioStep } from '../StudioContext'

export function StepFooter({ prev, next }: { prev?: StudioStep; next?: StudioStep }) {
  const { setStep, flushSave } = useStudio()

  const go = async (target: StudioStep) => {
    await flushSave()
    setStep(target)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mt-8 w-full max-w-7xl mx-auto flex items-center justify-between">
      {prev ? (
        <button
          onClick={() => go(prev)}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-zinc-800 hover:border-zinc-600 text-[13px] font-semibold text-zinc-300 hover:text-white transition-colors"
        >
          <CaretLeft size={12} weight="bold" />
          Back
        </button>
      ) : <span />}
      {next ? (
        <button
          onClick={() => go(next)}
          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-white text-black hover:bg-zinc-100 text-[13px] font-bold shadow-[0_2px_12px_rgba(255,255,255,0.1)]"
        >
          Continue
          <CaretRight size={12} weight="bold" />
        </button>
      ) : <span />}
    </div>
  )
}