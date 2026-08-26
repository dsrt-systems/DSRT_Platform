'use client'

import { useAppStudio, type AppStep } from './AppStudioContext'

const STEPS: { key: AppStep; label: string; index: number }[] = [
  { key: 'profile', label: 'Profile', index: 1 },
  { key: 'experience', label: 'Experience', index: 2 },
  { key: 'questions', label: 'Questions', index: 3 },
  { key: 'evidence', label: 'Evidence Mapping', index: 4 },
  { key: 'review', label: 'Review & Submit', index: 5 },
]

export function AppStudioNav() {
  const { step, setStep, draft } = useAppStudio()

  // Simplified completion logic for Phase 1
  const isComplete = (s: AppStep) => {
    const app = draft.application
    if (s === 'profile') return true // Pre-filled from snapshot
    if (s === 'experience') return true
    if (s === 'questions') return Object.keys(app.answers || {}).length > 0
    if (s === 'evidence') return (app.highlighted_projects || []).length > 0
    return false
  }

  return (
    <div className="flex items-center gap-2 -mb-px overflow-x-auto scrollbar-hide py-1">
      {STEPS.map((s) => {
        const isActive = step === s.key
        const complete = isComplete(s.key)
        return (
          <button
            key={s.key}
            onClick={() => setStep(s.key)}
            className={
              'relative flex items-center gap-2 py-3 px-4 text-[13px] font-semibold whitespace-nowrap transition-colors ' +
              (isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-200')
            }
          >
            <span
              className={
                'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold transition-colors ' +
                (isActive
                  ? 'bg-white text-black'
                  : complete
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800')
              }
            >
              {complete && !isActive ? '✓' : s.index}
            </span>
            {s.label}
            {isActive && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-white" />
            )}
          </button>
        )
      })}
    </div>
  )
}