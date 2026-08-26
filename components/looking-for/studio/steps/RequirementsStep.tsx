'use client'

import { StepFooter } from './StepFooter'
import { SkillsRequirementCard } from './parts/SkillsRequirementCard'
import { CompensationCard } from './parts/CompensationCard'
import { AvailabilityCard } from './parts/AvailabilityCard'
import { TeamContextCard } from './parts/TeamContextCard'
import { useStudio } from '../StudioContext'

export function RequirementsStep() {
  const { draft } = useStudio()
  const opp = draft.opportunity
  const skills = draft.skill_requirements || []

  const requiredCount = skills.filter((s: any) => s.priority === 'required').length
  const preferredCount = skills.filter((s: any) => s.priority === 'preferred').length
  const optionalCount = skills.filter((s: any) => s.priority === 'optional').length

  return (
    <>
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-[20px] font-bold text-white mb-1">Requirements</h2>
            <p className="text-[12.5px] text-zinc-500">
              Who are you looking for, and what will they be doing?
            </p>
          </div>

          <SkillsRequirementCard />
          <CompensationCard />
          <AvailabilityCard />
          <TeamContextCard />
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-[100px] space-y-4">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 mb-4">Requirement summary</h3>
              <SummaryRow label="Required skills" value={requiredCount} />
              <SummaryRow label="Preferred skills" value={preferredCount} />
              {optionalCount > 0 && <SummaryRow label="Optional skills" value={optionalCount} />}
              <div className="my-3 border-t border-zinc-800/70" />
              <SummaryRow label="Work mode" value={opp.work_mode || '—'} />
              <SummaryRow label="Time" value={opp.time_commitment || '—'} />
              <SummaryRow label="Length" value={opp.project_length || '—'} />
              <SummaryRow label="Positions" value={opp.positions_open || 1} />
              <div className="my-3 border-t border-zinc-800/70" />
              <SummaryRow label="Compensation" value={formatComp(opp)} />
              {opp.application_deadline && (
                <SummaryRow label="Deadline" value={new Date(opp.application_deadline).toLocaleDateString()} />
              )}
            </div>
          </div>
        </div>
      </div>
      <StepFooter prev="details" next="application" />
    </>
  )
}

function SummaryRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between items-center py-1.5 text-[12px]">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-200 font-semibold capitalize">{String(value).replace(/-/g, ' ')}</span>
    </div>
  )
}

function formatComp(opp: any): string {
  const type = opp.compensation_type
  if (!type || type === 'unpaid') return 'Unpaid'
  if (type === 'collaboration') return 'Collaboration'
  if (type === 'equity') return opp.equity_min ? `${opp.equity_min}–${opp.equity_max}% equity` : 'Equity'
  const curr = opp.compensation_currency === 'USD' ? '$' : opp.compensation_currency || ''
  if (opp.compensation_min || opp.compensation_max) {
    const min = opp.compensation_min ? `${curr}${opp.compensation_min.toLocaleString()}` : ''
    const max = opp.compensation_max ? `${curr}${opp.compensation_max.toLocaleString()}` : ''
    let period = ''
    if (type === 'hourly') period = '/hr'
    else if (type === 'monthly') period = '/mo'
    else if (type === 'annual') period = '/yr'
    return `${min}${max ? ` – ${max}` : ''}${period}`
  }
  return type.replace(/-/g, ' ')
}