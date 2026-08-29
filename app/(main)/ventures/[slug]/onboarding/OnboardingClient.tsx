'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingShell } from '@/components/venture-detail/team/onboarding/OnboardingShell'
import { Step1_Welcome } from '@/components/venture-detail/team/onboarding/steps/Step1_Welcome'
import { Step2_YourPosition } from '@/components/venture-detail/team/onboarding/steps/Step2_YourPosition'
import { Step3_YourTeam } from '@/components/venture-detail/team/onboarding/steps/Step3_YourTeam'
import { Step4_GettingStarted } from '@/components/venture-detail/team/onboarding/steps/Step4_GettingStarted'
import { Step5_AccessConfirmation } from '@/components/venture-detail/team/onboarding/steps/Step5_AccessConfirmation'
import { Step6_EnterVenture } from '@/components/venture-detail/team/onboarding/steps/Step6_EnterVenture'

interface Props {
  venture: any
  membership: any
  teamMembers: any[]
  currentUserId: string
}

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'position', label: 'Your Position' },
  { id: 'team', label: 'Your Team' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'access', label: 'Access' },
  { id: 'enter', label: 'Enter Venture' },
]

export function OnboardingClient({ venture, membership, teamMembers, currentUserId }: Props) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(membership.onboarding_current_step || 0)
  const [completing, setCompleting] = useState(false)

  // Persist step to backend
  useEffect(() => {
    const persist = async () => {
      try {
        await fetch(`/api/ventures/${venture.slug}/team/onboarding`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_step: currentStep })
        })
      } catch {}
    }
    if (currentStep !== membership.onboarding_current_step) {
      persist()
    }
  }, [currentStep, membership.onboarding_current_step, venture.slug])

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const complete = async () => {
    setCompleting(true)
    try {
      await fetch(`/api/ventures/${venture.slug}/team/onboarding`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complete: true })
      })
      router.push(`/ventures/${venture.slug}?welcome=1`)
    } catch {
      router.push(`/ventures/${venture.slug}`)
    }
  }

  return (
    <OnboardingShell
      steps={STEPS}
      currentStep={currentStep}
      onBack={currentStep > 0 ? goBack : undefined}
      onNext={currentStep < STEPS.length - 1 ? goNext : undefined}
      onComplete={currentStep === STEPS.length - 1 ? complete : undefined}
      completing={completing}
      venture={venture}
    >
      {currentStep === 0 && (
        <Step1_Welcome venture={venture} membership={membership} />
      )}
      {currentStep === 1 && (
        <Step2_YourPosition membership={membership} />
      )}
      {currentStep === 2 && (
        <Step3_YourTeam
          currentUserId={currentUserId}
          membership={membership}
          teamMembers={teamMembers}
        />
      )}
      {currentStep === 3 && (
        <Step4_GettingStarted venture={venture} membership={membership} />
      )}
      {currentStep === 4 && (
        <Step5_AccessConfirmation membership={membership} />
      )}
      {currentStep === 5 && (
        <Step6_EnterVenture venture={venture} membership={membership} />
      )}
    </OnboardingShell>
  )
}