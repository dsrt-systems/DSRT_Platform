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
  },
  { 
    number: 2, 
    title: 'Contribution', 
    subtitle: 'What you bring',
    heading: 'What do you bring to the table?',
    description: 'Select the skills, experience, and resources you can contribute to projects.',
  },
  { 
    number: 3, 
    title: 'Skills', 
    subtitle: 'Technical expertise',
    heading: 'What are you skilled at?',
    description: 'Add the tools, languages, and disciplines you excel at.',
  },
  { 
    number: 4, 
    title: 'Interests', 
    subtitle: 'What excites you',
    heading: 'What are you interested in?',
    description: 'Choose the industries and problem spaces that inspire your work.',
  },
  { 
    number: 5, 
    title: 'Institution', 
    subtitle: 'Where you belong',
    heading: 'Your institution or organization',
    description: 'Connect with peers from your university, company, or professional community.',
  },
  { 
    number: 6, 
    title: 'Goals', 
    subtitle: 'What you seek',
    heading: 'What are you looking for?',
    description: 'Tell us what you are here to accomplish. We tailor your entire DSRT experience around this.',
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
    return <div className="min-h-screen bg-[#05070D]" />
  }

  const safeStep = Math.min(Math.max(Number(step) || 1, 1), 6)
  const currentStep = stepConfig[safeStep - 1]

  return (
    <div className="min-h-screen bg-[#05070D] text-white flex flex-col relative overflow-hidden">
      
      {/* Premium Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#111A30] via-[#05070D] to-[#05070D] opacity-80 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" /> {/* Optional: add a tiny noise texture if you want true enterprise feel */}

      {/* Elevated Header */}
      <header className="relative z-10 border-b border-white/[0.04] px-6 lg:px-12 h-20 flex items-center justify-between bg-[#05070D]/80 backdrop-blur-md">
        <DsrtLogo size={32} showText />
        
        {/* Mobile Step Indicator */}
        <div className="lg:hidden text-[13px] text-white/50 font-medium bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/10">
          Step <span className="text-white">{safeStep}</span> / 6
        </div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col lg:flex-row max-w-[1400px] mx-auto w-full">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:block w-[360px] p-12 border-r border-white/[0.04]">
          <nav className="space-y-1.5 relative">
            {/* Connecting Line */}
            <div className="absolute left-[15px] top-6 bottom-6 w-px bg-white/10 -z-10" />

            {stepConfig.map((s) => {
              const isCompleted = safeStep > s.number
              const isCurrent = safeStep === s.number
              return (
                <button
                  key={s.number}
                  onClick={() => isCompleted && setStep(s.number)}
                  disabled={!isCompleted && !isCurrent}
                  className={cn(
                    "w-full flex items-start gap-4 p-3 rounded-xl text-left transition-all duration-300",
                    isCurrent && "bg-white/[0.04] shadow-[0_0_20px_rgba(255,255,255,0.02)] border border-white/5",
                    isCompleted && "hover:bg-white/[0.02] cursor-pointer",
                    !isCurrent && !isCompleted && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 transition-all duration-300",
                    isCurrent ? "bg-[#4F7CFF] text-white shadow-[0_0_15px_rgba(79,124,255,0.4)]" :
                    isCompleted ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" :
                    "bg-[#0A0D14] border border-white/20 text-white/40"
                  )}>
                    {isCompleted ? <Check className="w-4 h-4" strokeWidth={3} /> : s.number}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className={cn(
                      "text-[14px] font-bold tracking-wide",
                      isCurrent ? "text-white" : isCompleted ? "text-white/80" : "text-white/50"
                    )}>
                      {s.title}
                    </div>
                    <div className="text-[12px] text-white/40 mt-1 pr-4">{s.subtitle}</div>
                  </div>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* MAIN FORM AREA */}
        <main className="flex-1 flex justify-center p-6 lg:p-12 items-start pt-8 lg:pt-16">
          <div className="w-full max-w-[540px]">
            
            {/* Glassmorphic Elevated Card */}
            <div className="bg-[#0A0D14]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden">
              
              {/* Subtle top card glow */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#4F7CFF]/40 to-transparent" />

              <div className="mb-10">
                <p className="text-[11px] font-bold tracking-widest text-[#4F7CFF] uppercase mb-3">
                  Step {safeStep}
                </p>
                <h1 className="text-[28px] lg:text-[32px] font-bold tracking-tight text-white leading-tight mb-3">
                  {currentStep.heading}
                </h1>
                <p className="text-[15px] text-white/60 leading-relaxed">
                  {currentStep.description}
                </p>
              </div>

              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
                {safeStep === 1 && <StepIdentity />}
                {safeStep === 2 && <StepBrings />}
                {safeStep === 3 && <StepSkills />}
                {safeStep === 4 && <StepInterests />}
                {safeStep === 5 && <StepInstitution />}
                {safeStep === 6 && <StepSeeking />}
              </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  )
}