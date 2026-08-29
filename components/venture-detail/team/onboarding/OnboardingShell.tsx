'use client'

import { CaretLeft, CaretRight, CircleNotch, ArrowRight } from '@phosphor-icons/react'

interface Step {
  id: string
  label: string
}

interface Props {
  steps: Step[]
  currentStep: number
  onBack?: () => void
  onNext?: () => void
  onComplete?: () => void
  completing?: boolean
  venture: any
  children: React.ReactNode
}

export function OnboardingShell({
  steps, currentStep, onBack, onNext, onComplete, completing, venture, children
}: Props) {
  const isLastStep = currentStep === steps.length - 1

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">

      {/* Header */}
      <header className="border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          {venture.logo_url ? (
            <img
              src={venture.logo_url}
              alt=""
              className="w-8 h-8 rounded-lg object-cover border border-white/[0.06]"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/[0.06] flex items-center justify-center text-[11px] font-bold text-white">
              {venture.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
              Team Onboarding
            </p>
            <p className="text-[13px] font-bold text-white truncate">{venture.name}</p>
          </div>
          <div className="text-right">
            <p className="text-[10.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
              Step {currentStep + 1} of {steps.length}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">{steps[currentStep]?.label}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-3xl mx-auto px-6 pb-4">
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className={
                  'flex-1 h-1 rounded-full transition-all ' +
                  (i <= currentStep ? 'bg-white' : 'bg-white/[0.06]')
                }
              />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#0d0d10]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            disabled={!onBack}
            className={
              'flex items-center gap-1.5 h-10 px-3 rounded-lg text-[12.5px] font-semibold transition-colors ' +
              (onBack
                ? 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                : 'text-zinc-700 cursor-not-allowed')
            }
          >
            <CaretLeft size={13} weight="bold" />
            Back
          </button>

          {isLastStep ? (
            <button
              onClick={onComplete}
              disabled={completing}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-white text-black text-[12.5px] font-bold hover:bg-zinc-200 disabled:opacity-40 transition-colors shadow-sm"
            >
              {completing ? (
                <><CircleNotch size={13} className="animate-spin" /> Entering venture…</>
              ) : (
                <>Enter Venture <ArrowRight size={13} weight="bold" /></>
              )}
            </button>
          ) : (
            <button
              onClick={onNext}
              disabled={!onNext}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-white text-black text-[12.5px] font-bold hover:bg-zinc-200 disabled:opacity-40 transition-colors"
            >
              Continue
              <CaretRight size={13} weight="bold" />
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}