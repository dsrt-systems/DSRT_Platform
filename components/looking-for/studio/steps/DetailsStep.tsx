'use client'

import { StepFooter } from './StepFooter'
import { StudioRichEditor } from './parts/StudioRichEditor'
import { StudioMediaPanel } from './parts/StudioMediaPanel'
import { InfoTooltip } from './parts/InfoTooltip'

export function DetailsStep() {
  return (
    <>
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-[20px] font-bold text-white mb-1 flex items-center">
              Details
              <InfoTooltip text="This text forms the main body of your opportunity page. Markdown formatting is supported." />
            </h2>
            <p className="text-[12.5px] text-zinc-500">
              Provide a comprehensive description of the opportunity, responsibilities, and goals.
            </p>
          </div>
          <StudioRichEditor />
        </div>

        <div className="space-y-6">
          <StudioMediaPanel />
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 mb-4">Structure Tips</h3>
            <ul className="space-y-4">
              <Tip title="Start with the 'Why'" desc="Explain why this role or project exists and the impact it will have." />
              <Tip title="Use clear headers" desc="Break content into 'What you'll do', 'Who you are', and 'What we offer'." />
              <Tip title="Be transparent" desc="Unclear expectations lead to dropped applications. Be explicit about day-to-day realities." />
            </ul>
          </div>
        </div>
      </div>
      <StepFooter prev="basics" next="requirements" />
    </>
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