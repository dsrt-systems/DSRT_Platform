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
import { CheckCircle2 } from 'lucide-react'

const stepConfig = [
  { 
    number: 1, 
    shortTitle: 'Identity',
    heading: 'Identity',
    description: 'Set up your public presence and professional identity on DSRT Connect.',
    tips: [
      'Your legal name helps build trust with future collaborators and investors.',
      'A short tagline doubles profile visits — think of it as your headline.',
      'Location helps you match with nearby founders and opportunities.'
    ]
  },
  { 
    number: 2, 
    shortTitle: 'Contribution',
    heading: 'What you bring',
    description: 'Select the skills, experience, and resources you can contribute to projects and teams.',
    tips: [
      'Being specific increases match quality by up to 3x.',
      'Select all that apply — you can update these anytime later.',
      'Founders who list technical skills get 40% more requests.'
    ]
  },
  { 
    number: 3, 
    shortTitle: 'Skills',
    heading: 'Technical expertise',
    description: 'Add the tools, languages, and disciplines you excel at. These power our AI recommendations.',
    tips: [
      'Add at least 5 skills for optimal matching.',
      'Include both hard skills (React, Figma) and soft skills.',
      'DSRT uses these to surface you in relevant opportunities.'
    ]
  },
  { 
    number: 4, 
    shortTitle: 'Interests',
    heading: 'Interests',
    description: 'Choose the industries, technologies, and problem spaces that inspire your work.',
    tips: [
      'Your interests shape your personalized feed.',
      'You will see projects related to what you choose.',
      'Diverse interests unlock cross-industry connections.'
    ]
  },
  { 
    number: 5, 
    shortTitle: 'Institution',
    heading: 'Institution',
    description: 'Connect with peers from your university, company, or professional community.',
    tips: [
      'Verified institutions get exclusive community access.',
      'Alumni networks on DSRT source top talent here.',
      'You can add multiple institutions from settings later.'
    ]
  },
  { 
    number: 6, 
    shortTitle: 'Goals',
    heading: 'Goals & Workflow',
    description: 'Tell us what you are here to accomplish. We tailor your entire experience around this.',
    tips: [
      'Clear goals attract the right collaborators.',
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
    return <div className="min-h-screen bg-[#050505]" />
  }

  const safeStep = Math.min(Math.max(Number(step) || 1, 1), 6)
  const currentStep = stepConfig[safeStep - 1]

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="border-b border-white/5 h-16 flex items-center px-6">
        <DsrtLogo size={24} showText />
      </header>

      {/* Main Container */}
      <div className="max-w-[1200px] w-full mx-auto px-6 pt-10 pb-20">
        
        {/* Horizontal Stepper */}
        <div className="flex items-center gap-1 overflow-x-auto pb-4 mb-8 border-b border-white/5 scrollbar-hide">
          {stepConfig.map((s, idx) => {
            const isCompleted = safeStep > s.number
            const isCurrent = safeStep === s.number
            
            return (
              <div key={s.number} className="flex items-center">
                <button
                  onClick={() => isCompleted && setStep(s.number)}
                  disabled={!isCompleted && !isCurrent}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 transition-all relative group whitespace-nowrap",
                    !isCurrent && !isCompleted && "cursor-not-allowed opacity-50"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <div className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 border",
                      isCurrent ? "bg-white text-black border-white" : "border-white/20 text-white/50"
                    )}>
                      {s.number}
                    </div>
                  )}
                  <span className={cn(
                    "text-[13px] font-medium transition-colors",
                    isCurrent ? "text-white" : "text-white/50"
                  )}>
                    {s.shortTitle}
                  </span>

                  {/* Active Indicator Underline */}
                  {isCurrent && (
                    <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-white rounded-t-full" />
                  )}
                </button>
                
                {/* Separator Line */}
                {idx < stepConfig.length - 1 && (
                  <div className="w-6 h-[1px] mx-1 bg-white/5" />
                )}
              </div>
            )
          })}
        </div>

        {/* Content Layout: Form (Left) + How This Works (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Main Form Area */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="mb-8">
              <h1 className="text-[24px] font-semibold text-white tracking-tight mb-2">
                {currentStep.heading}
              </h1>
              <p className="text-[14px] text-white/50">
                {currentStep.description}
              </p>
            </div>

            <div className="bg-[#0C0C0E] border border-white/5 rounded-2xl p-6 md:p-8">
              {safeStep === 1 && <StepIdentity />}
              {safeStep === 2 && <StepBrings />}
              {safeStep === 3 && <StepSkills />}
              {safeStep === 4 && <StepInterests />}
              {safeStep === 5 && <StepInstitution />}
              {safeStep === 6 && <StepSeeking />}
            </div>
          </div>

          {/* Tips Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-[#0C0C0E] border border-white/5 rounded-2xl p-6 sticky top-6">
              <h3 className="text-[11px] font-bold text-white/40 tracking-widest uppercase mb-4">
                How this works
              </h3>
              <div className="space-y-4">
                {currentStep.tips.map((tip, idx) => (
                  <p key={idx} className="text-[13px] text-white/70 leading-relaxed">
                    <span className="font-semibold text-white mr-1">Tip:</span>
                    {tip}
                  </p>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}