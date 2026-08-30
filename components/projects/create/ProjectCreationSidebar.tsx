'use client'

import { CheckCircle, Circle } from '@phosphor-icons/react'
import { ProjectStepKey } from '@/stores/projectCreationStore'

export const PROJECT_STEPS: { key: ProjectStepKey; title: string; desc: string }[] = [
  { key: 'identity', title: 'Identity', desc: 'Name, type, and visual identity' },
  { key: 'definition', title: 'Definition', desc: 'Problem, goals, and domains' },
  { key: 'build', title: 'Build', desc: 'Stage, tech stack, and links' },
  { key: 'collaboration', title: 'Collaboration', desc: 'Team and open roles' },
  { key: 'publish', title: 'Publish', desc: 'Visibility and launch' },
]

interface Props {
  currentStep: ProjectStepKey
  onStepClick: (step: ProjectStepKey) => void
}

export function ProjectCreationSidebar({ currentStep, onStepClick }: Props) {
  const currentIndex = PROJECT_STEPS.findIndex(s => s.key === currentStep)

  return (
    <div className="hidden lg:block w-[260px] shrink-0">
      <h3 className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-6">
        Project Setup
      </h3>
      <div className="space-y-1 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        {PROJECT_STEPS.map((step, idx) => {
          const isActive = step.key === currentStep
          const isPast = idx < currentIndex

          return (
            <button
              key={step.key}
              onClick={() => onStepClick(step.key)}
              className={`w-full flex items-start gap-4 p-3 rounded-xl transition-all relative z-10 ${
                isActive ? 'bg-white/[0.04] border border-white/[0.08]' : 'hover:bg-white/[0.02]'
              }`}
            >
              <div className="mt-0.5 bg-[#050505]">
                {isPast ? (
                  <CheckCircle size={18} weight="fill" className="text-emerald-400" />
                ) : isActive ? (
                  <div className="w-[18px] h-[18px] rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                ) : (
                  <Circle size={18} className="text-white/20" />
                )}
              </div>
              <div className="text-left">
                <p className={`text-[13px] font-bold ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                  {step.title}
                </p>
                <p className={`text-[11px] mt-0.5 ${isActive ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {step.desc}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}