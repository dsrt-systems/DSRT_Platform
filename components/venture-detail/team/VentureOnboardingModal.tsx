'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  X, ArrowRight, ArrowLeft, CheckCircle,
  Briefcase, UsersThree, FileText, Rocket
} from '@phosphor-icons/react'

interface Props {
  slug: string
  venture: any
}

export function VentureOnboardingModal({ slug, venture }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (searchParams.get('onboarding') === '1') {
      setOpen(true)
      setStep(1)
    }
  }, [searchParams])

  const close = () => {
    setOpen(false)
    router.replace(pathname || `/ventures/${slug}`, { scroll: false })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4" onClick={close}>
      <div className="relative w-full max-w-lg bg-[#0d0d10] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        
        <button onClick={close} className="absolute top-4 right-4 w-8 h-8 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 flex items-center justify-center z-10">
          <X size={14} />
        </button>

        <div className="p-8">
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-1.5 mb-6">
            {[1, 2, 3, 4, 5].map(s => (
              <div
                key={s}
                className={
                  'h-1 rounded-full transition-all ' +
                  (s === step ? 'w-8 bg-white' : s < step ? 'w-3 bg-emerald-400' : 'w-3 bg-zinc-800')
                }
              />
            ))}
          </div>

          {step === 1 && (
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle size={24} weight="fill" className="text-emerald-400" />
              </div>
              <h2 className="text-[22px] font-bold text-white tracking-tight">Welcome to {venture.name}</h2>
              <p className="text-[13.5px] text-zinc-400 mt-2 leading-relaxed">
                You are officially an active member of this venture team. Your position is now reflected in the organizational graph.
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-zinc-800 flex items-center justify-center mb-4">
                <Briefcase size={22} className="text-white" />
              </div>
              <h2 className="text-[20px] font-bold text-white tracking-tight">Your Position & Scope</h2>
              <p className="text-[13.5px] text-zinc-400 mt-2 leading-relaxed">
                Your responsibilities and reporting lines are synced with the team architecture. You can review them anytime under the Team tab.
              </p>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-zinc-800 flex items-center justify-center mb-4">
                <UsersThree size={22} className="text-white" />
              </div>
              <h2 className="text-[20px] font-bold text-white tracking-tight">Team Collaboration</h2>
              <p className="text-[13.5px] text-zinc-400 mt-2 leading-relaxed">
                You can now communicate directly through team updates, participate in open role discussions, and contribute to company knowledge.
              </p>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-zinc-800 flex items-center justify-center mb-4">
                <FileText size={22} className="text-white" />
              </div>
              <h2 className="text-[20px] font-bold text-white tracking-tight">Venture Documents</h2>
              <p className="text-[13.5px] text-zinc-400 mt-2 leading-relaxed">
                Access internal documentation, research notes, and venture guidelines directly from the Documents tab.
              </p>
            </div>
          )}

          {step === 5 && (
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-zinc-800 flex items-center justify-center mb-4">
                <Rocket size={22} className="text-white" />
              </div>
              <h2 className="text-[20px] font-bold text-white tracking-tight">Ready to build</h2>
              <p className="text-[13.5px] text-zinc-400 mt-2 leading-relaxed">
                Explore the workspace, review open roles, and check the latest venture updates.
              </p>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-zinc-800">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-zinc-400 hover:text-white disabled:opacity-30"
            >
              <ArrowLeft size={12} /> Back
            </button>

            {step < 5 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white text-black text-[12.5px] font-bold hover:bg-zinc-100"
              >
                Continue <ArrowRight size={12} weight="bold" />
              </button>
            ) : (
              <button
                onClick={close}
                className="inline-flex items-center gap-1.5 h-9 px-5 rounded-lg bg-white text-black text-[12.5px] font-bold hover:bg-zinc-100"
              >
                Enter Workspace
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}