'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CircleNotch, FloppyDisk } from '@phosphor-icons/react'
import { DsrtLogo } from '@/components/ui/DsrtLogo'
import { useProjectCreationStore } from '@/stores/projectCreationStore'

import { ProjectCreationSidebar, PROJECT_STEPS } from './ProjectCreationSidebar'
import { ProjectCreationFooter } from './ProjectCreationFooter'
import { ProjectCreationTips } from './ProjectCreationTips'

import { IdentityStep } from './steps/IdentityStep'
import { DefinitionStep } from './steps/DefinitionStep'
import { BuildStep } from './steps/BuildStep'
import { CollaborationStep } from './steps/CollaborationStep'
import { PublishStep } from './steps/PublishStep'

const HEADINGS: Record<string, { heading: string; description: string }> = {
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
    description: "Set your collaboration preferences, invite team members, or draft open roles for DSRT Looking For.",
  },
  publish: {
    heading: 'Ready to launch?',
    description: 'Review your project preview and completeness checklist before making it live.',
  },
}

export function ProjectCreationStudio() {
  const router = useRouter()
  const {
    data,
    currentStep,
    isSaving,
    hasUnsavedChanges,
    setCurrentStep,
    setSaving,
    markSaved,
  } = useProjectCreationStore()

  // ── AUTO-SAVE LOGIC ──
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

        if (res.ok && result.project?.id && !data.id) {
          useProjectCreationStore.getState().updateData({ id: result.project.id })
        }

        markSaved()
        if (isExiting) {
          toast.success('Project draft saved')
          router.push('/projects')
        }
      } catch (e) {
        console.error('Autosave error:', e)
        if (isExiting) toast.error('Failed to save draft')
      } finally {
        setSaving(false)
      }
    },
    [data, markSaved, router, setSaving]
  )

  // Save on tab blur or visibility change
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
    const idx = PROJECT_STEPS.findIndex(s => s.key === currentStep)
    if (idx < PROJECT_STEPS.length - 1) {
      setCurrentStep(PROJECT_STEPS[idx + 1].key)
      if (hasUnsavedChanges) triggerAutoSave(false)
    }
  }

  const handleBack = () => {
    const idx = PROJECT_STEPS.findIndex(s => s.key === currentStep)
    if (idx > 0) setCurrentStep(PROJECT_STEPS[idx - 1].key)
  }

  const currentStepNumber = PROJECT_STEPS.findIndex(s => s.key === currentStep) + 1

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col selection:bg-white/20">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 bg-[#050505]/95 backdrop-blur-md border-b border-white/[0.06] h-16 flex items-center px-6 lg:px-10">
        <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <DsrtLogo size={26} showText />
            <div className="h-4 w-px bg-white/20" />
            <span className="text-[13px] font-semibold text-white/60">
              Project Creation Studio
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isSaving ? (
              <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
                <CircleNotch size={12} className="animate-spin" /> Saving...
              </span>
            ) : data.id ? (
              <span className="text-[11px] font-mono text-zinc-500">Draft saved</span>
            ) : null}

            <button
              onClick={handleSaveExit}
              disabled={isSaving || !data.name}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-semibold text-white/60 hover:text-white hover:bg-white/[0.04] transition-all disabled:opacity-40"
            >
              <FloppyDisk size={14} weight="bold" /> Save & Exit
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <main className="flex-1 py-10 lg:py-14 px-6 lg:px-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
            
            {/* Left Steps Navigation */}
            <ProjectCreationSidebar
              currentStep={currentStep}
              onStepClick={setCurrentStep}
            />

            {/* Center Form Area */}
            <div className="flex-1 min-w-0 max-w-[680px]">
              <div className="mb-8">
                <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-2">
                  Step {currentStepNumber} of {PROJECT_STEPS.length}
                </p>
                <h1 className="text-[26px] lg:text-[28px] font-bold text-white tracking-tight leading-tight">
                  {HEADINGS[currentStep].heading}
                </h1>
                <p className="text-[14px] text-zinc-400 mt-2 leading-relaxed">
                  {HEADINGS[currentStep].description}
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
                canContinue={!!data.name && data.name.trim().length >= 2 && !!data.tagline}
                onBack={handleBack}
                onContinue={handleNext}
                onPublish={() => {
                  document.getElementById('hidden-publish-trigger')?.click()
                }}
              />
            </div>

            {/* Right Contextual Tips Panel */}
            <ProjectCreationTips
              step={currentStep}
              projectType={data.project_type || 'personal'}
            />

          </div>
        </div>
      </main>
    </div>
  )
}