'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DsrtLogo } from '@/components/ui/DsrtLogo'
import { OnboardingSidebar, OnboardingTips, onboardingStepConfig } from '@/components/onboarding/OnboardingSidebar'
import { useOnboardingV2Store, type OnboardingStepKey } from '@/stores/onboardingV2Store'
import { IdentityStep } from './steps/IdentityStep'
import { ProfileStep } from './steps/ProfileStep'
import { ProfessionalStep } from './steps/ProfessionalStep'
import { SkillsStep } from './steps/SkillsStep'
import { PersonalizationStep } from './steps/PersonalizationStep'

const stepHeadings: Record<OnboardingStepKey, { heading: string; description: string }> = {
  identity: {
    heading: 'Create your DSRT identity',
    description: "Choose the username you'll use across DSRT Connect. Your unique DSRT workspace address will be created from it.",
  },
  profile: {
    heading: 'Set up your profile',
    description: "A photo and location help others recognize you. Both are optional — you can add them anytime later.",
  },
  professional: {
    heading: 'What best describes you?',
    description: 'Select the roles that reflect who you are professionally. This shapes your recommendations and connections.',
  },
  skills: {
    heading: 'What are you skilled at?',
    description: 'Add the tools, disciplines, and skills you excel at. Skip this step if you prefer to add them later.',
  },
  personalization: {
    heading: 'Personalize your experience',
    description: 'A few last questions so DSRT Connect can show you what matters most from day one.',
  },
}

export function OnboardingClient() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [hydrating, setHydrating] = useState(true)

  const { step_states, currentStep, isSaving, setCurrentStep, hydrateFromServer } = useOnboardingV2Store()

  useEffect(() => {
    setMounted(true)
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      try {
        const res = await fetch('/api/onboarding/state')
        if (res.ok) {
          const data = await res.json()
          if (data.profile?.onboarding_complete) return router.push('/home')
          hydrateFromServer(data)
        }
      } catch {}
      finally { setHydrating(false) }
    }
    init()
  }, [router, hydrateFromServer])

  const handleSaveExit = useCallback(async () => {
    toast.success('Progress saved')
    setTimeout(() => router.push('/home'), 500)
  }, [router])

  if (!mounted || hydrating) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
      </div>
    )
  }

  const { heading, description } = stepHeadings[currentStep]
  const currentStepConfig = onboardingStepConfig.find(s => s.key === currentStep)
  const currentStepNumber = currentStepConfig?.number || 1

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col relative overflow-hidden">
      
      {/* Deep Gradient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(79,124,255,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_100%,rgba(79,124,255,0.08),transparent)]" />
      </div>

      {/* Fixed Header */}
      <header className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.06] h-16 flex items-center px-6 lg:px-10">
        <div className="max-w-[1300px] w-full mx-auto flex items-center justify-between">
          <DsrtLogo size={28} showText />
          
          <button
            onClick={handleSaveExit}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-all disabled:opacity-40"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save & exit</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-10 lg:py-14 px-6 lg:px-10 relative z-10">
        <div className="max-w-[1300px] mx-auto">
          {/* items-start prevents columns from stretching to equal heights, preserving sticky behavior */}
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
            
            {/* LEFT COLUMN: Sidebar Navigation + Desktop Tips */}
            <aside className="w-full lg:w-[300px] lg:flex-shrink-0 lg:sticky lg:top-24 space-y-8">
              <OnboardingSidebar
                currentStep={currentStep}
                stepStates={step_states}
                onStepClick={setCurrentStep}
              />
              {/* Visible on large screens only */}
              <div className="hidden lg:block">
                <OnboardingTips currentStep={currentStep} />
              </div>
            </aside>

            {/* RIGHT COLUMN: Form Area */}
            <div className="flex-1 min-w-0 w-full max-w-[720px] flex flex-col">
              <div className="mb-10">
                <p className="text-[11px] font-bold text-[#4F7CFF] tracking-widest uppercase mb-3">
                  Step {currentStepNumber} of 5
                </p>
                <h1 className="text-[32px] lg:text-[36px] font-bold text-white tracking-tight leading-[1.1]">
                  {heading}
                </h1>
                <p className="text-[15px] text-white/60 mt-3 leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Padded Form Card */}
              <div className="bg-gradient-to-br from-[#0C0D12] to-[#08090D] border border-white/[0.06] rounded-2xl p-6 md:p-10 shadow-2xl backdrop-blur-md">
                {currentStep === 'identity' && <IdentityStep />}
                {currentStep === 'profile' && <ProfileStep />}
                {currentStep === 'professional' && <ProfessionalStep />}
                {currentStep === 'skills' && <SkillsStep />}
                {currentStep === 'personalization' && <PersonalizationStep />}
              </div>

              {/* Mobile Tips: Shown BELOW the form on small screens */}
              <div className="block lg:hidden mt-10">
                <OnboardingTips currentStep={currentStep} />
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}