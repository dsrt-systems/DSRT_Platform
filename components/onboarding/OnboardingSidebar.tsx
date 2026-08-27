'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OnboardingStepKey, StepStatus } from '@/stores/onboardingV2Store'

interface StepConfig {
  key: OnboardingStepKey
  number: number
  title: string
  description: string
}

const steps: StepConfig[] = [
  { key: 'identity',        number: 1, title: 'Identity',       description: 'Claim your DSRT username' },
  { key: 'profile',         number: 2, title: 'Profile',        description: 'Photo and location' },
  { key: 'professional',    number: 3, title: 'Professional',   description: 'How you identify' },
  { key: 'skills',          number: 4, title: 'Skills',         description: 'What you can do' },
  { key: 'personalization', number: 5, title: 'Personalization', description: 'Tailor your experience' },
]

interface Props {
  currentStep: OnboardingStepKey
  stepStates: Record<OnboardingStepKey, StepStatus>
  onStepClick: (step: OnboardingStepKey) => void
}

export function OnboardingSidebar({ currentStep, stepStates, onStepClick }: Props) {
  return (
    <aside className="w-full lg:w-[280px] lg:flex-shrink-0">
      <div className="lg:sticky lg:top-24">
        <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-4 px-1">
          Your setup
        </p>
        
        <nav className="space-y-0.5">
          {steps.map((step, idx) => {
            const status = stepStates[step.key]
            const isCurrent = currentStep === step.key
            const isCompleted = status === 'COMPLETED' || status === 'SKIPPED'
            const isClickable = isCompleted || isCurrent

            return (
              <button
                key={step.key}
                type="button"
                onClick={() => isClickable && onStepClick(step.key)}
                disabled={!isClickable}
                className={cn(
                  "w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left transition-all",
                  isCurrent && "bg-white/[0.04]",
                  isCompleted && !isCurrent && "hover:bg-white/[0.02]",
                  !isCurrent && !isCompleted && "cursor-not-allowed opacity-40"
                )}
              >
                {/* Step indicator */}
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted && !isCurrent ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-400" strokeWidth={3} />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <span className="text-[10px] font-bold text-black">{step.number}</span>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center">
                      <span className="text-[10px] font-medium text-white/40">{step.number}</span>
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-[13px] font-semibold leading-tight",
                    isCurrent ? "text-white" : isCompleted ? "text-white/80" : "text-white/50"
                  )}>
                    {step.title}
                    {status === 'SKIPPED' && (
                      <span className="ml-1.5 text-[10px] font-normal text-white/40">(skipped)</span>
                    )}
                  </div>
                  <div className="text-[11px] text-white/40 mt-0.5 leading-tight">
                    {step.description}
                  </div>
                </div>
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export { steps as onboardingStepConfig }