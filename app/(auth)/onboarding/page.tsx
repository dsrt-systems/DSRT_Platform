'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { createClient } from '@/lib/supabase/client'
import { Progress } from '@/components/ui/progress'
import { StepIdentity } from './steps/StepIdentity'
import { StepBrings } from './steps/StepBrings'
import { StepSkills } from './steps/StepSkills'
import { StepInterests } from './steps/StepInterests'
import { StepInstitution } from './steps/StepInstitution'
import { StepSeeking } from './steps/StepSeeking'
import { motion, AnimatePresence } from 'framer-motion'

const TOTAL_STEPS = 6

const stepConfig = [
  { number: 1, title: 'Who are you?', subtitle: 'Tell us about yourself' },
  { number: 2, title: 'What do you bring?', subtitle: 'Select all that describe you' },
  { number: 3, title: 'Your skills', subtitle: 'What can you do?' },
  { number: 4, title: 'Your interests', subtitle: 'What are you passionate about?' },
  { number: 5, title: 'Your institution', subtitle: 'Where do you study or work?' },
  { number: 6, title: 'What are you looking for?', subtitle: 'What brings you to DSRT?' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { step } = useOnboardingStore()

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [])

  const currentStep = stepConfig[step - 1]

  const renderStep = () => {
    switch (step) {
      case 1: return <StepIdentity />
      case 2: return <StepBrings />
      case 3: return <StepSkills />
      case 4: return <StepInterests />
      case 5: return <StepInstitution />
      case 6: return <StepSeeking />
      default: return <StepIdentity />
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="font-bold text-lg tracking-tight">DSRT</h1>
        <span className="text-sm text-muted-foreground">
          Step {step} of {TOTAL_STEPS}
        </span>
      </div>

      {/* Progress bar */}
      <Progress value={(step / TOTAL_STEPS) * 100} className="h-1 rounded-none" />

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-1">
              Step {step} of {TOTAL_STEPS}
            </p>
            <h2 className="text-3xl font-bold tracking-tight">
              {currentStep.title}
            </h2>
            <p className="text-muted-foreground mt-1">{currentStep.subtitle}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}