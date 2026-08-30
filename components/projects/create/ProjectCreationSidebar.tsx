// components/projects/create/ProjectCreationSidebar.tsx
'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProjectStepKey } from '@/stores/projectCreationStore'

export interface ProjectStepConfig {
  key: ProjectStepKey
  number: number
  title: string
  desc: string
}

export const PROJECT_STEPS: ProjectStepConfig[] = [
  { key: 'identity', number: 1, title: 'Identity', desc: 'Name, type, and visuals' },
  { key: 'definition', number: 2, title: 'Definition', desc: 'About, problem, and domains' },
  { key: 'build', number: 3, title: 'Build', desc: 'Stage, tech stack, and links' },
  { key: 'collaboration', number: 4, title: 'Collaboration', desc: 'Team and open roles' },
  { key: 'publish', number: 5, title: 'Publish', desc: 'Preview and launch' },
]

const STEP_TIPS: Record<ProjectStepKey, { title: string; tips: string[]; usage: string }> = {
  identity: {
    title: 'Tips for project identity',
    tips: [
      'Keep your name short, unique, and easy to remember.',
      'Explain WHAT your project does before explaining HOW it works.',
      'A project cover image increases profile views by up to 3x.',
    ],
    usage: 'Your project identity powers how it appears on the global Explore feed, home feed cards, and search results across DSRT.',
  },
  definition: {
    title: 'Tips for clear definition',
    tips: [
      'Answer three core questions: What are you building? Why does it matter? Who is it for?',
      'Select up to 3 domains from our global taxonomy for exact matching.',
      'You can expand the description anytime inside your Project Workspace.',
    ],
    usage: 'Domains and definitions train the DSRT AI recommendation engine to connect you with interested builders and relevant opportunities.',
  },
  build: {
    title: 'Tips for build details',
    tips: [
      'Be transparent about your current stage — builders appreciate honesty over hype.',
      'Add key frameworks and tools so developers can evaluate technical fit.',
      'Connecting a repository allows DSRT to display live activity metrics.',
    ],
    usage: 'Your tech stack and stage allow other developers to filter projects in Explore and find open-source repositories matching their skills.',
  },
  collaboration: {
    title: 'Tips for collaboration',
    tips: [
      'Define clear roles if you need specific skills to ship your project.',
      'You can publish as a solo builder and add team members whenever you are ready.',
      'Roles created here automatically publish to DSRT Looking For.',
    ],
    usage: 'Collaboration preferences control whether DSRT members can send contribution requests directly to your Project Workspace.',
  },
  publish: {
    title: 'Tips before launching',
    tips: [
      'Review your card preview to ensure typography and images look balanced.',
      'Public projects become discoverable by all DSRT members immediately.',
      'You can change visibility or edit any detail from Project Settings anytime.',
    ],
    usage: 'Publishing registers your canonical DSRT project ID and broadcasts a launch signal to the global builder network.',
  },
}

interface Props {
  currentStep: ProjectStepKey
  completedSteps: Record<ProjectStepKey, boolean>
  canNavigateToStep: (step: ProjectStepKey) => boolean
  onStepClick: (step: ProjectStepKey) => void
}

export function ProjectCreationSidebar({
  currentStep,
  completedSteps,
  canNavigateToStep,
  onStepClick,
}: Props) {
  const currentTips = STEP_TIPS[currentStep]

  return (
    <aside className="w-full lg:w-[300px] lg:flex-shrink-0">
      <div className="lg:sticky lg:top-24 space-y-6">
        
        {/* Setup Steps */}
        <div>
          <p className="text-[11px] font-bold text-white/40 tracking-widest uppercase mb-4 px-1">
            Project Setup
          </p>

          <nav className="space-y-0.5">
            {PROJECT_STEPS.map((step) => {
              const isCurrent = currentStep === step.key
              const isCompleted = completedSteps[step.key]
              const isClickable = canNavigateToStep(step.key)

              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => isClickable && onStepClick(step.key)}
                  disabled={!isClickable}
                  className={cn(
                    'w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left transition-all',
                    isCurrent && 'bg-white/[0.04]',
                    isCompleted && !isCurrent && 'hover:bg-white/[0.02]',
                    !isCurrent && !isCompleted && !isClickable && 'cursor-not-allowed opacity-40'
                  )}
                >
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

                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        'text-[13px] font-semibold leading-tight',
                        isCurrent ? 'text-white' : isCompleted ? 'text-white/80' : 'text-white/50'
                      )}
                    >
                      {step.title}
                    </div>
                    <div className="text-[11px] text-white/40 mt-0.5 leading-tight">
                      {step.desc}
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tips Box */}
        <div className="rounded-md border border-white/[0.06] bg-[#0A0A0C] p-4">
          <p className="text-[10px] font-bold text-white/50 tracking-widest uppercase mb-3">
            {currentTips.title}
          </p>
          <ul className="space-y-2">
            {currentTips.tips.map((tip, idx) => (
              <li key={idx} className="text-[12px] text-white/65 leading-relaxed flex gap-2">
                <span className="text-white/30 flex-shrink-0">·</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* How We Use This Box */}
        <div className="rounded-md border border-white/[0.06] bg-[#0A0A0C] p-4">
          <p className="text-[10px] font-bold text-white/50 tracking-widest uppercase mb-2">
            How we use this
          </p>
          <p className="text-[12px] text-white/65 leading-relaxed">
            {currentTips.usage}
          </p>
        </div>

      </div>
    </aside>
  )
}