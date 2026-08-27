'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { createClient } from '@/lib/supabase/client'
import { DsrtLogo } from '@/components/ui/DsrtLogo'
import { StepIdentity } from './steps/StepIdentity'
import { StepBrings } from './steps/StepBrings'
import { StepSkills } from './steps/StepSkills'
import { StepInterests } from './steps/StepInterests'
import { StepInstitution } from './steps/StepInstitution'
import { StepSeeking } from './steps/StepSeeking'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const stepConfig = [
  { 
    number: 1, 
    title: 'Identity', 
    subtitle: 'Personal information',
    heading: 'Tell us who you are',
    description: "Let's start with the basics. This information forms your public presence on DSRT.",
    tips: [
      'Your legal name helps you build trust with future collaborators and investors.',
      'A short tagline can double your profile visits — think of it as your headline.',
      'Location helps you match with nearby founders, meetups, and opportunities.'
    ]
  },
  { 
    number: 2, 
    title: 'Contribution', 
    subtitle: 'What you bring',
    heading: 'What do you bring to the table?',
    description: 'Select the skills, experience, and resources you can contribute to projects and teams.',
    tips: [
      'Being specific increases match quality by up to 3x.',
      'Select all that apply — you can update these anytime later.',
      'Founders who list technical skills get 40% more collaboration requests.'
    ]
  },
  { 
    number: 3, 
    title: 'Skills', 
    subtitle: 'Technical expertise',
    heading: 'What are you skilled at?',
    description: 'Add the tools, languages, and disciplines you excel at. These power our AI recommendations.',
    tips: [
      'Add at least 5 skills for optimal matching.',
      'Include both hard skills (React, Figma) and soft skills (leadership, strategy).',
      'DSRT AI uses these to surface you in relevant opportunities.'
    ]
  },
  { 
    number: 4, 
    title: 'Interests', 
    subtitle: 'What excites you',
    heading: 'What are you interested in?',
    description: 'Choose the industries, technologies, and problem spaces that inspire your work.',
    tips: [
      'Your interests shape your personalized feed and community suggestions.',
      'You will see projects, ventures, and posts related to what you choose.',
      'Diverse interests unlock cross-industry connections.'
    ]
  },
  { 
    number: 5, 
    title: 'Institution', 
    subtitle: 'Where you belong',
    heading: 'Your institution or organization',
    description: 'Connect with peers from your university, company, or professional community.',
    tips: [
      'Verified institutions get exclusive community access.',
      'Alumni networks on DSRT often source top talent for their startups.',
      'You can add multiple institutions from your Profile settings later.'
    ]
  },
  { 
    number: 6, 
    title: 'Goals', 
    subtitle: 'What you seek',
    heading: 'What are you looking for?',
    description: 'Tell us what you are here to accomplish. We tailor your entire DSRT experience around this.',
    tips: [
      'Clear goals attract the right collaborators to your profile.',
      'You can adjust your goals anytime as your journey evolves.',
      'DSRT ranks opportunities based on your selected outcomes.'
    ]
  },
]

export function OnboardingClient() {
  const router = useRouter()
  const { step, setStep } = useOnboardingStore()
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
      <div className="min-h-screen bg-[#05070D] flex items-center justify-center text-white/40 text-sm">
        Loading...
      </div>
    )
  }

  const safeStep = Math.min(Math.max(Number(step) || 1, 1), 6)
  const currentStep = stepConfig[safeStep - 1]

  return (
    <div className="min-h-screen bg-[#05070D] text-white flex flex-col">
      {/* Header with DSRT Logo */}
      <header className="border-b border-white/[0.06] px-6 md:px-8 h-14 flex items-center justify-between">
        <DsrtLogo size={26} showText />
        <div className="text-[12px] text-white/50 font-medium">
          Step <span className="text-white">{safeStep}</span> of 6
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* LEFT SIDEBAR — Steps & Tips */}
        <aside className="w-full md:w-[300px] lg:w-[340px] border-b md:border-b-0 md:border-r border-white/[0.06] p-6 md:p-8 md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:overflow-y-auto">
          <div className="max-w-xs">
            {/* Step Navigation */}
            <nav className="space-y-1 mb-8">
              {stepConfig.map((s) => {
                const isCompleted = safeStep > s.number
                const isCurrent = safeStep === s.number
                return (
                  <button
                    key={s.number}
                    onClick={() => isCompleted && setStep(s.number)}
                    disabled={!isCompleted && !isCurrent}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-md text-left transition-colors",
                      isCurrent && "bg-white/[0.04]",
                      isCompleted && "hover:bg-white/[0.03] cursor-pointer",
                      !isCurrent && !isCompleted && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-semibold flex-shrink-0 border",
                      isCurrent && "bg-[#4F7CFF] border-[#4F7CFF] text-white",
                      isCompleted && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
                      !isCurrent && !isCompleted && "bg-transparent border-white/10 text-white/40"
                    )}>
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "text-[13px] font-semibold leading-tight",
                        isCurrent ? "text-white" : isCompleted ? "text-white/70" : "text-white/40"
                      )}>
                        {s.title}
                      </div>
                      <div className="text-[11px] text-white/40 mt-0.5">{s.subtitle}</div>
                    </div>
                  </button>
                )
              })}
            </nav>

            {/* Tips Section */}
            <div className="pt-6 border-t border-white/[0.06]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-3">
                Tips for this step
              </p>
              <ul className="space-y-3">
                {currentStep.tips.map((tip, i) => (
                  <li key={i} className="text-[12px] text-white/60 leading-relaxed flex gap-2">
                    <span className="text-[#4F7CFF] flex-shrink-0 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* RIGHT FORM AREA */}
        <main className="flex-1 flex justify-center p-6 md:p-10">
          <div className="w-full max-w-[480px]">
            <div className="mb-8">
              <p className="text-[12px] text-white/40 font-medium mb-1">
                STEP {safeStep} OF 6
              </p>
              <h1 className="text-[26px] font-semibold tracking-tight text-white leading-tight">
                {currentStep.heading}
              </h1>
              <p className="text-[14px] text-white/60 mt-2 leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            <div className="onboarding-step-container">
              {safeStep === 1 && <StepIdentity />}
              {safeStep === 2 && <StepBrings />}
              {safeStep === 3 && <StepSkills />}
              {safeStep === 4 && <StepInterests />}
              {safeStep === 5 && <StepInstitution />}
              {safeStep === 6 && <StepSeeking />}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}