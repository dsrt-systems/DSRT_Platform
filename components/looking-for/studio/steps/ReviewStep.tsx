'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Rocket, Eye, CircleNotch } from '@phosphor-icons/react'
import { StepFooter } from './StepFooter'
import { useStudio } from '../StudioContext'
import { CompletionChecklist } from './parts/CompletionChecklist'
import { StudioPreview } from './parts/StudioPreview'

export function ReviewStep() {
  const { draft, setStep, flushSave } = useStudio()
  const router = useRouter()
  const oppId = draft.opportunity.id
  const [publishing, setPublishing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState<any[] | null>(null)

  const handlePublish = async () => {
    setPublishing(true)
    setErrors(null)
    try {
      await flushSave()
      const res = await fetch(`/api/opportunities/drafts/${oppId}/publish`, { method: 'POST' })
      const d = await res.json()
      
      if (!res.ok) {
        if (d.errors && Array.isArray(d.errors)) {
          setErrors(d.errors)
        } else {
          alert(d.error || 'Publish failed')
        }
        setPublishing(false)
        return
      }

      // Success — redirect to public page
      router.push(`/looking-for/${d.slug || d.opportunity_id}`)
    } catch (e: any) {
      alert(e?.message || 'Publish failed')
      setPublishing(false)
    }
  }

  return (
    <>
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-[20px] font-bold text-white mb-1">Review & Publish</h2>
            <p className="text-[12.5px] text-zinc-500">
              Verify everything, preview the public page, and publish.
            </p>
          </div>

          <CompletionChecklist onJumpTo={setStep} />

          {errors && errors.length > 0 && (
            <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-5">
              <div className="text-[13px] font-bold text-red-200 mb-2">Publish blocked. Fix these first:</div>
              <ul className="space-y-1.5">
                {errors.map((err: any, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-[12.5px] text-red-300">
                    <span className="w-1 h-1 rounded-full bg-red-400" />
                    <span>{err.message}</span>
                    <button
                      onClick={() => setStep(err.step)}
                      className="text-red-200 hover:text-white underline underline-offset-2 text-[11.5px]"
                    >
                      Go →
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0f0f11] p-5 md:p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-[13px] font-bold text-white mb-1">Ready to launch?</div>
                <div className="text-[11.5px] text-zinc-500">
                  Publishing makes this opportunity live on DSRT immediately.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  disabled={publishing}
                  className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl border border-zinc-800 hover:border-zinc-600 text-[13px] font-semibold text-zinc-300 hover:text-white disabled:opacity-50"
                >
                  <Eye size={13} weight="regular" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-white text-black hover:bg-zinc-100 text-[13px] font-bold shadow-[0_2px_16px_rgba(255,255,255,0.1)] disabled:opacity-60"
                >
                  {publishing ? (
                    <>
                      <CircleNotch size={13} className="animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Rocket size={13} weight="fill" />
                      Publish Opportunity
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-[100px] space-y-4">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 mb-3">What happens next</h3>
              <ol className="space-y-3">
                <StepInfo n={1} title="Instant publish" desc="Opportunity goes live and appears in enabled surfaces." />
                <StepInfo n={2} title="Search indexing" desc="Users can find it in DSRT search within seconds." />
                <StepInfo n={3} title="Auto recommendations" desc="Matched to relevant users based on skills and interests." />
                <StepInfo n={4} title="You manage from cockpit" desc="Applicants, messages, analytics all in My Opportunities." />
              </ol>
            </div>
          </div>
        </div>
      </div>

      <StepFooter prev="distribution" />

      {showPreview && <StudioPreview onClose={() => setShowPreview(false)} />}
    </>
  )
}

function StepInfo({ n, title, desc }: { n: number, title: string, desc: string }) {
  return (
    <li className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-400 shrink-0">
        {n}
      </div>
      <div>
        <div className="text-[12.5px] font-bold text-zinc-200">{title}</div>
        <div className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </li>
  )
}