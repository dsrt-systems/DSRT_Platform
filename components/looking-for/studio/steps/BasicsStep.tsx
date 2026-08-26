'use client'

import { useStudio } from '../StudioContext'
import { StepFooter } from './StepFooter'
import { CategoryPicker } from './parts/CategoryPicker'
import { ContextPicker } from './parts/ContextPicker'
import { TitleInput } from './parts/TitleInput'
import { InfoTooltip } from './parts/InfoTooltip'
import { Briefcase, Rocket, Users, Wrench, Handshake, BookOpen, CurrencyDollar, CodeBlock } from '@phosphor-icons/react'

const TYPES = [
  { id: 'hire', label: 'Hire', desc: 'Full-time, part-time or contract', icon: Briefcase },
  { id: 'freelance', label: 'Freelance', desc: 'Short-term or project-based', icon: Wrench },
  { id: 'cofounder', label: 'Co-founder', desc: 'Start a new venture together', icon: Rocket },
  { id: 'team-up', label: 'Team Up', desc: 'Find collaborators for an idea', icon: Users },
  { id: 'mentorship', label: 'Mentorship', desc: 'Find or offer guidance', icon: BookOpen },
  { id: 'open-source', label: 'Open Source', desc: 'Contributors for OSS', icon: CodeBlock },
  { id: 'bounty', label: 'Bounty', desc: 'Reward for specific tasks', icon: CurrencyDollar },
  { id: 'consulting', label: 'Consulting', desc: 'Expert advisory services', icon: Handshake },
]

export function BasicsStep() {
  const { draft, updateField } = useStudio()
  const opp = draft.opportunity

  return (
    <>
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8">
        
        <div className="space-y-8">
          <div>
            <h2 className="text-[20px] font-bold text-white mb-1">Basics</h2>
            <p className="text-[12.5px] text-zinc-500">
              Define the core identity of this opportunity. What is it, and who is it for?
            </p>
          </div>

          <div className="space-y-6">
            <Field label="What are you looking for?" tooltip="This sets the primary icon and defaults for your opportunity card across DSRT." required>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TYPES.map(t => (
                  <TypeCard key={t.id} type={t} active={opp.opportunity_type === t.id} onClick={() => updateField({ opportunity_type: t.id })} />
                ))}
              </div>
            </Field>

            <Field label="Opportunity Title" tooltip="A clear, standard title performs best in search. You can select a suggestion or type your own." required>
              <TitleInput 
                value={opp.title || ''} 
                onChange={(v) => updateField({ title: v })} 
              />
            </Field>

            <Field label="Short Subtitle (Optional)" tooltip="A one-sentence hook that appears on the feed card before users click in.">
              <div className="relative">
                <textarea
                  value={opp.subtitle || ''}
                  onChange={(e) => updateField({ subtitle: e.target.value.slice(0, 200) })}
                  placeholder="A concise, one-sentence hook summarizing the role or project..."
                  rows={2}
                  className="w-full py-3 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none transition-colors leading-relaxed"
                />
                <span className="absolute right-3 bottom-3 text-[10.5px] text-zinc-600 font-mono pointer-events-none">
                  {opp.subtitle?.length || 0}/200
                </span>
              </div>
            </Field>

            <Field label="Category" tooltip="Helps the DSRT recommendation engine match this opportunity to the right builders." required>
              <CategoryPicker />
            </Field>

            <Field label="Associated Context" tooltip="Link this opportunity to a Venture or Project you own. It will automatically display on that entity's public page.">
              <p className="text-[11.5px] text-zinc-500 mb-3 leading-relaxed">
                Is this a personal request, or are you hiring on behalf of a specific Project, Venture, or Community?
              </p>
              <ContextPicker />
            </Field>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-[100px] rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 mb-4">Tips for Success</h3>
            <ul className="space-y-4">
              <Tip title="Be specific in titles" desc="Titles like 'Need a dev' perform poorly. 'React Native Developer for Fintech app' gets 4x more clicks." />
              <Tip title="Use subcategories" desc="Selecting a subcategory improves your match rate in the recommendation engine." />
              <Tip title="Link to projects" desc="Opportunities linked to a Venture or Project automatically appear on those pages." />
            </ul>
          </div>
        </div>
      </div>

      <StepFooter next="details" />
    </>
  )
}

function Field({ label, tooltip, required, children }: { label: string; tooltip?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0f0f11] p-5 md:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <label className="flex items-center text-[13px] font-bold text-white mb-4">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
        {required && <span className="ml-2 text-[10px] text-blue-400 uppercase tracking-wider bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 font-semibold">Required</span>}
      </label>
      {children}
    </div>
  )
}

function TypeCard({ type, active, onClick }: { type: any; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all ' +
        (active
          ? 'border-white/25 bg-white/[0.08] shadow-[0_4px_16px_rgba(255,255,255,0.05)]'
          : 'border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900/50 hover:border-zinc-700')
      }
    >
      <type.icon size={20} weight={active ? 'fill' : 'regular'} className={active ? 'text-white' : 'text-zinc-500'} />
      <div>
        <div className={'text-[12.5px] font-bold ' + (active ? 'text-white' : 'text-zinc-300')}>{type.label}</div>
        <div className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{type.desc}</div>
      </div>
    </button>
  )
}

function Tip({ title, desc }: { title: string; desc: string }) {
  return (
    <li>
      <div className="text-[12px] font-bold text-zinc-300 mb-1">{title}</div>
      <div className="text-[11.5px] text-zinc-500 leading-relaxed">{desc}</div>
    </li>
  )
}