'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DsrtLogo } from '@/components/ui/DsrtLogo'
import { OnboardingSidebar, onboardingStepConfig } from '@/components/onboarding/OnboardingSidebar'
import {
  useOnboardingV2Store,
  type OnboardingStepKey,
} from '@/stores/onboardingV2Store'

// Steps (Cleaned import paths from ./steps/)
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

  const {
    step_states,
    currentStep,
    isSaving,
    setCurrentStep,
    hydrateFromServer,
  } = useOnboardingV2Store()

  // Auth check + hydrate
  useEffect(() => {
    setMounted(true)
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch onboarding state from server
      try {
        const res = await fetch('/api/onboarding/state')
        if (res.ok) {
          const data = await res.json()
          if (data.profile?.onboarding_complete) {
            router.push('/home')
            return
          }
          hydrateFromServer(data)
        }
      } catch {
        // Fallback to store defaults
      } finally {
        setHydrating(false)
      }
    }
    init()
  }, [router, hydrateFromServer])

  const handleSaveExit = useCallback(async () => {
    toast.success('Progress saved. You can continue anytime.')
    setTimeout(() => router.push('/home'), 500)
  }, [router])

  const handleStepClick = useCallback((step: OnboardingStepKey) => {
    setCurrentStep(step)
  }, [setCurrentStep])

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
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
      {/* Fixed Header */}
      <header className="sticky top-0 z-30 bg-[#050505]/95 backdrop-blur-md border-b border-white/[0.06] h-16 flex items-center px-6 lg:px-10">
        <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between">
          <DsrtLogo size={26} showText />
          
          <button
            onClick={handleSaveExit}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-all disabled:opacity-40"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save & exit</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-10 lg:py-14 px-6 lg:px-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
            {/* Sidebar */}
            <OnboardingSidebar
              currentStep={currentStep}
              stepStates={step_states}
              onStepClick={handleStepClick}
            />

            {/* Step Content */}
            <div className="flex-1 min-w-0 max-w-[640px]">
              {/* Heading */}
              <div className="mb-8">
                <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-2">
                  Step {currentStepNumber} of 5
                </p>
                <h1 className="text-[26px] lg:text-[28px] font-semibold text-white tracking-tight leading-tight">
                  {heading}
                </h1>
                <p className="text-[14px] text-white/60 mt-2 leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Step Components */}
              <div className="animate-in fade-in duration-300">
                {currentStep === 'identity' && <IdentityStep />}
                {currentStep === 'profile' && <ProfileStep />}
                {currentStep === 'professional' && <ProfessionalStep />}
                {currentStep === 'skills' && <SkillsStep />}
                {currentStep === 'personalization' && <PersonalizationStep />}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}