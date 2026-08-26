'use client'

import { StepFooter } from './StepFooter'
import { PipelineTemplateCard } from './parts/PipelineTemplateCard'
import { ReviewersTeamCard } from './parts/ReviewersTeamCard'
import { useStudio } from '../StudioContext'

export function WorkflowStep() {
  const { draft } = useStudio()
  const oppId = draft.opportunity.id

  return (
    <>
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-[20px] font-bold text-white mb-1">Workflow</h2>
            <p className="text-[12.5px] text-zinc-500">
              Configure your applicant pipeline and invite teammates to help review.
            </p>
          </div>
          <PipelineTemplateCard />
          {/* Passing the opportunityId fixes the empty state bug! */}
          <ReviewersTeamCard opportunityId={oppId} />
        </div>
        <div className="hidden lg:block">
          <div className="sticky top-[100px] rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 mb-4">How this works</h3>
            <p className="text-[11.5px] text-zinc-400 leading-relaxed mb-4">
              <span className="text-zinc-200 font-semibold">Stages</span> are the columns in your applicant Kanban board. Core stages stay locked so counters and history remain consistent.
            </p>
            <p className="text-[11.5px] text-zinc-400 leading-relaxed">
              <span className="text-zinc-200 font-semibold">Reviewer teammates</span> see only applicants you explicitly assign to them later, keeping hiring context private and focused.
            </p>
          </div>
        </div>
      </div>
      <StepFooter prev="application" next="distribution" />
    </>
  )
}