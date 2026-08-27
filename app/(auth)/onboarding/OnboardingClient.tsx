'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { createClient } from '@/lib/supabase/client'
import { StepIdentity } from './steps/StepIdentity'
import { StepBrings } from './steps/StepBrings'
import { StepSkills } from './steps/StepSkills'
import { StepInterests } from './steps/StepInterests'
import { StepInstitution } from './steps/StepInstitution'
import { StepSeeking } from './steps/StepSeeking'

const TOTAL_STEPS = 6

const stepConfig = [
  { number: 1, title: 'Who are you?', subtitle: 'Tell us about yourself' },
  { number: 2, title: 'What do you bring?', subtitle: 'Select all that describe you' },
  { number: 3, title: 'Your skills', subtitle: 'What can you do?' },
  { number: 4, title: 'Your interests', subtitle: 'What are you passionate about?' },
  { number: 5, title: 'Your institution', subtitle: 'Where do you study or work?' },
  { number: 6, title: 'What are you looking for?', subtitle: 'What brings you to DSRT?' },
]

export function OnboardingClient() {
  const router = useRouter()
  const { step } = useOnboardingStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/login')
    }
    checkAuth()
  }, [router])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#05070D] flex items-center justify-center text-white/50 text-sm">
        Loading DSRT Onboarding...
      </div>
    )
  }

  const safeStep = Math.min(Math.max(Number(step) || 1, 1), TOTAL_STEPS)
  const currentStep = stepConfig[safeStep - 1]
  const progressPct = (safeStep / TOTAL_STEPS) * 100

  return (
    <div className="min-h-screen bg-[#05070D] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/[0.08] px-6 py-4 flex items-center justify-between">
        <h1 className="font-bold text-lg tracking-tight text-white">DSRT</h1>
        <span className="text-sm text-white/50">
          Step {safeStep} of {TOTAL_STEPS}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-white/10">
        <div
          className="h-full bg-[#4F7CFF] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <p className="text-sm text-white/50 mb-1">
              Step {safeStep} of {TOTAL_STEPS}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              {currentStep.title}
            </h2>
            <p className="text-white/50 mt-1">{currentStep.subtitle}</p>
          </div>

          <div>
            {safeStep === 1 && <StepIdentity />}
            {safeStep === 2 && <StepBrings />}
            {safeStep === 3 && <StepSkills />}
            {safeStep === 4 && <StepInterests />}
            {safeStep === 5 && <StepInstitution />}
            {safeStep === 6 && <StepSeeking />}
          </div>
        </div>
      </div>
    </div>
  )
}