'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, LogOut } from 'lucide-react'
import { WarningCircle } from '@phosphor-icons/react'
import { DsrtLogo } from '@/components/ui/DsrtLogo'
import { useProjectCreationStore, ProjectStepKey } from '@/stores/projectCreationStore'

import { ProjectCreationSidebar, PROJECT_STEPS } from './ProjectCreationSidebar'
import { ProjectCreationFooter } from './ProjectCreationFooter'

import { IdentityStep } from './steps/IdentityStep'
import { DefinitionStep } from './steps/DefinitionStep'
import { BuildStep } from './steps/BuildStep'
import { CollaborationStep } from './steps/CollaborationStep'
import { PublishStep } from './steps/PublishStep'

const STEP_HEADINGS: Record<ProjectStepKey, { heading: string; description: string }> = {
  identity: {
    heading: 'Start with the identity of your project',
    description: 'Give your project a clear identity so people can understand what it is at a glance.',
  },
  definition: {
    heading: "Explain what you're building",
    description: 'Help people understand the problem, idea, and purpose behind your project.',
  },
  build: {
    heading: 'How is this project being built?',
    description: 'Tell DSRT about your development stage, technology stack, and source repository.',
  },
  collaboration: {
    heading: 'Decide who is involved',
    description: 'Set your collaboration preferences, invite team members, or draft open roles for DSRT Looking For.',
  },
  publish: {
    heading: 'Ready to launch?',
    description: 'Review your project preview and completeness checklist before making it live.',
  },
}

interface Props {
  continueDraftId?: string | null
}

export function ProjectCreationStudio({ continueDraftId }: Props) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [draftCount, setDraftCount] = useState<number>(0)
  const [showLimitWarning, setShowLimitWarning] = useState(false)

  const {
    data,
    currentStep,
    completedSteps,
    isSaving,
    hasUnsavedChanges,
    setCurrentStep,
    setSaving,
    markSaved,
    canNavigateToStep,
    reset,
    hydrateFromServer,
  } = useProjectCreationStore()

  // ─── FRESH vs CONTINUE INITIALIZATION ───
  useEffect(() => {
    const init = async () => {
      // Fetch draft count first
      try {
        const countRes = await fetch('/api/projects/drafts/count')
        const countData = await countRes.json()
        setDraftCount(countData.count || 0)

        if (continueDraftId) {
          // CONTINUE existing draft
          const res = await fetch(`/api/projects/draft/${continueDraftId}`)
          if (res.ok) {
            const json = await res.json()
            if (json.draft) {
              reset() // Clear old state first
              hydrateFromServer(json.draft)
              toast.success(`Resumed draft: ${json.draft.name}`)
            }
          } else {
            toast.error('Could not load draft')
            router.push('/projects/create')
            return
          }
        } else {
          // NEW project - reset the store completely
          reset()

          // Check limit BEFORE letting them start
          if ((countData.count || 0) >= (countData.limit || 10)) {
            setShowLimitWarning(true)
          }
        }
      } catch (err) {
        console.error('Init error:', err)
      } finally {
        setInitializing(false)
        setMounted(true)
      }
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continueDraftId])

  // ─── AUTO-SAVE ───
  const triggerAutoSave = useCallback(
    async (isExiting = false) => {
      if (!data.name || data.name.trim().length < 2) return

      setSaving(true)
      try {
        const res = await fetch('/api/projects/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await res.json()

        if (!res.ok) {
          if (result.code === 'DRAFT_LIMIT_REACHED') {
            toast.error(result.error, { duration: 6000 })
            setShowLimitWarning(true)
            if (isExiting) router.push('/projects')
            return
          }
          throw new Error(result.error || 'Save failed')
        }

        if (result.project?.id && !data.id) {
          useProjectCreationStore.getState().updateData({ id: result.project.id })
        }

        markSaved()
        if (isExiting) {
          toast.success('Project draft saved')
          reset() // Clear store so next visit is fresh
          router.push('/projects')
        }
      } catch (e: any) {
        console.error('Autosave error:', e)
        if (isExiting) toast.error(e.message || 'Failed to save draft')
      } finally {
        setSaving(false)
      }
    },
    [data, markSaved, router, setSaving, reset]
  )

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges) {
        triggerAutoSave(false)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [hasUnsavedChanges, triggerAutoSave])

  const handleSaveExit = () => triggerAutoSave(true)

  const handleNext = () => {
    const steps: ProjectStepKey[] = ['identity', 'definition', 'build', 'collaboration', 'publish']
    const idx = steps.indexOf(currentStep)
    if (idx < steps.length - 1) {
      const nextStep = steps[idx + 1]
      setCurrentStep(nextStep)
      if (hasUnsavedChanges) triggerAutoSave(false)
    }
  }

  const handleBack = () => {
    const steps: ProjectStepKey[] = ['identity', 'definition', 'build', 'collaboration', 'publish']
    const idx = steps.indexOf(currentStep)
    if (idx > 0) setCurrentStep(steps[idx - 1])
  }

  if (!mounted || initializing) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
        <DsrtLogo size={48} showText={false} />
        <p className="text-[11px] font-bold text-white/40 tracking-widest uppercase">
          LOADING CREATION STUDIO...
        </p>
      </div>
    )
  }

  const { heading, description } = STEP_HEADINGS[currentStep]
  const currentStepNumber = PROJECT_STEPS.findIndex(s => s.key === currentStep) + 1
  const canContinueCurrent = completedSteps[currentStep] || currentStep === 'publish' || currentStep === 'build' || currentStep === 'collaboration'
  
  const isNearLimit = draftCount >= 8 && draftCount < 10 && !continueDraftId
  const isAtLimit = draftCount >= 10 && !continueDraftId

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col selection:bg-white/20">
      <header className="sticky top-0 z-30 bg-[#050505]/95 backdrop-blur-md border-b border-white/[0.06] h-16 flex items-center px-6 lg:px-10">
        <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between">
          <DsrtLogo size={26} showText />

          <div className="flex items-center gap-4">
            {isSaving ? (
              <span className="text-[11px] font-mono text-white/40 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </span>
            ) : data.id ? (
              <span className="text-[11px] font-mono text-white/40">Draft saved</span>
            ) : null}

            <button
              onClick={handleSaveExit}
              disabled={isSaving || !data.name}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-all disabled:opacity-40"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save & exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── DRAFT LIMIT WARNING BANNER (Auto-dismisses) ─── */}
      {(showLimitWarning || isNearLimit || isAtLimit) && (
        <DraftLimitBanner
          count={draftCount}
          limit={10}
          isAtLimit={isAtLimit}
          onDismiss={() => setShowLimitWarning(false)}
          onGoBack={() => router.push('/projects')}
        />
      )}

      <main className="flex-1 py-10 lg:py-14 px-6 lg:px-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
            <ProjectCreationSidebar
              currentStep={currentStep}
              completedSteps={completedSteps}
              canNavigateToStep={canNavigateToStep}
              onStepClick={setCurrentStep}
            />

            <div className="flex-1 min-w-0 max-w-[640px]">
              <div className="mb-8">
                <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-2">
                  Step {currentStepNumber} of {PROJECT_STEPS.length}
                </p>
                <h1 className="text-[26px] lg:text-[28px] font-semibold text-white tracking-tight leading-tight">
                  {heading}
                </h1>
                <p className="text-[14px] text-white/60 mt-2 leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="animate-in fade-in duration-300">
                {currentStep === 'identity' && <IdentityStep />}
                {currentStep === 'definition' && <DefinitionStep />}
                {currentStep === 'build' && <BuildStep />}
                {currentStep === 'collaboration' && <CollaborationStep />}
                {currentStep === 'publish' && <PublishStep />}
              </div>

              <ProjectCreationFooter
                currentStep={currentStep}
                isSaving={isSaving}
                canContinue={canContinueCurrent && !isAtLimit}
                onBack={handleBack}
                onContinue={handleNext}
                onPublish={() => {
                  document.getElementById('hidden-publish-trigger')?.click()
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── AUTO-DISMISS WARNING BANNER ───
function DraftLimitBanner({
  count,
  limit,
  isAtLimit,
  onDismiss,
  onGoBack,
}: {
  count: number
  limit: number
  isAtLimit: boolean
  onDismiss: () => void
  onGoBack: () => void
}) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!isAtLimit) {
      // Only auto-dismiss the "nearing" warning, not the hard block
      const timer = setTimeout(() => {
        setVisible(false)
        onDismiss()
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [isAtLimit, onDismiss])

  if (!visible && !isAtLimit) return null

  return (
    <div className={`border-b transition-all ${isAtLimit ? 'bg-[#1a0f0f] border-red-500/20' : 'bg-[#181410] border-white/[0.06]'}`}>
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <WarningCircle className={`w-4 h-4 shrink-0 ${isAtLimit ? 'text-red-400' : 'text-white/60'}`} />
          <p className="text-[13px] text-white/80">
            {isAtLimit ? (
              <>
                <strong className="text-white">Draft limit reached.</strong> You have {count}/{limit} active drafts. Publish or delete one to create a new project.
              </>
            ) : (
              <>
                You have <strong className="text-white">{count} of {limit}</strong> draft projects active. Consider publishing or deleting older drafts.
              </>
            )}
          </p>
        </div>
        {isAtLimit ? (
          <button
            onClick={onGoBack}
            className="text-[12px] font-medium text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 h-7 px-3 rounded-md transition-all"
          >
            Manage drafts
          </button>
        ) : (
          <button
            onClick={() => { setVisible(false); onDismiss() }}
            className="text-[11px] font-medium text-white/40 hover:text-white transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}