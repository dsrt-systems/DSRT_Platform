'use client'

import type { StudioStep } from './StudioContext'
import { useStudio } from './StudioContext'

const STEPS: { key: StudioStep; label: string; index: number }[] = [
  { key: 'basics', label: 'Basics', index: 1 },
  { key: 'details', label: 'Details', index: 2 },
  { key: 'requirements', label: 'Requirements', index: 3 },
  { key: 'application', label: 'Application', index: 4 },
  { key: 'workflow', label: 'Workflow', index: 5 },
  { key: 'distribution', label: 'Distribution', index: 6 },
  { key: 'review', label: 'Review', index: 7 },
]

export function StudioStepNav({
  active,
  onChange,
}: {
  active: StudioStep
  onChange: (s: StudioStep) => void
}) {
  const { draft } = useStudio()

  const isComplete = (step: StudioStep): boolean => {
    const o = draft.opportunity
    switch (step) {
      case 'basics':
        return !!o.title && o.title !== 'Untitled opportunity' && !!o.opportunity_type
      case 'details':
        return !!(o.description || o.content_text)
      case 'requirements': {
        const hasSkills = (draft.skill_requirements || []).length > 0
        const hasComp = !!o.compensation_type
        const hasMode = !!o.work_mode
        return hasSkills && hasComp && hasMode
      }
      case 'application':
        return true
      case 'workflow':
        return true
      case 'distribution':
        return true
      case 'review':
        return o.status !== 'draft'
      default:
        return false
    }
  }

  return (
    <div className="flex items-center gap-1 -mb-px overflow-x-auto scrollbar-hide py-1">
      {STEPS.map((s) => {
        const isActive = active === s.key
        const complete = isComplete(s.key)
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={
              'relative flex items-center gap-2 py-3 px-4 text-[13px] font-semibold whitespace-nowrap transition-colors ' +
              (isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-200')
            }
          >
            <span
              className={
                'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ' +
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