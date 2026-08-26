'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Warning } from '@phosphor-icons/react'
import { StudioHeader } from './StudioHeader'
import { StudioStepNav } from './StudioStepNav'
import {
  StudioContext,
  type StudioDraft,
  type SaveStatus,
  type StudioStep,
} from './StudioContext'
import { BasicsStep } from './steps/BasicsStep'
import { DetailsStep } from './steps/DetailsStep'
import { RequirementsStep } from './steps/RequirementsStep'
import { ApplicationStep } from './steps/ApplicationStep'
import { WorkflowStep } from './steps/WorkflowStep'
import { DistributionStep } from './steps/DistributionStep'
import { ReviewStep } from './steps/ReviewStep'

export function StudioShell({ draftId }: { draftId: string }) {
  const router = useRouter()
  const sp = useSearchParams()

  const [draft, setDraft] = useState<StudioDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const initialStep = (sp.get('step') as StudioStep) || 'basics'
  const [step, setStep] = useState<StudioStep>(initialStep)

  const pendingSaveRef = useRef<NodeJS.Timeout | null>(null)
  const pendingPatchRef = useRef<Record<string, any>>({})
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Load draft
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/opportunities/drafts/${draftId}`, {
        cache: 'no-store',
      })
      const d = await res.json().catch(() => null)
      if (!res.ok) throw new Error(d?.error || 'Failed to load')
      setDraft(d)
    } catch (e: any) {
      setError(e?.message || 'Failed to load draft')
    } finally {
      setLoading(false)
    }
  }, [draftId])

  useEffect(() => {
    load()
  }, [load])

  // URL sync
  useEffect(() => {
    const p = new URLSearchParams(sp.toString())
    if (step === 'basics') p.delete('step')
    else p.set('step', step)
    const qs = p.toString()
    router.replace(
      `/looking-for/create-v2/${draftId}${qs ? `?${qs}` : ''}`,
      { scroll: false }
    )
  }, [step, draftId, sp, router])

  // Autosave function — debounced
  const savePatch = useCallback(async () => {
    const patch = pendingPatchRef.current
    if (Object.keys(patch).length === 0) return
    pendingPatchRef.current = {}
    setSaveStatus('saving')

    try {
      const res = await fetch(`/api/opportunities/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patch,
          expected_updated_at: draft?.opportunity?.updated_at,
        }),
      })
      const d = await res.json().catch(() => null)
      if (!res.ok) {
        if (d?.code === 'stale') {
          if (isMountedRef.current) {
            setSaveStatus('error')
            await load()
            setSaveStatus('saved')
          }
          return
        }
        throw new Error(d?.error || 'Save failed')
      }

      if (isMountedRef.current) {
        setDraft((prev) =>
          prev
            ? {
                ...prev,
                opportunity: {
                  ...prev.opportunity,
                  ...patch,
                  updated_at: d.updated_at,
                },
              }
            : prev
        )
        setLastSavedAt(new Date())
        setSaveStatus('saved')
      }
    } catch (e: any) {
      console.error('Save failed:', e)
      if (isMountedRef.current) setSaveStatus('error')
    }
  }, [draftId, draft?.opportunity?.updated_at, load])

  // Update a field (optimistic + debounced save)
  const updateField = useCallback(
    (patch: Record<string, any>) => {
      if (!draft) return
      setDraft((prev) =>
        prev
          ? { ...prev, opportunity: { ...prev.opportunity, ...patch } }
          : prev
      )
      pendingPatchRef.current = { ...pendingPatchRef.current, ...patch }

      if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current)
      pendingSaveRef.current = setTimeout(() => {
        savePatch()
      }, 800)
    },
    [draft, savePatch]
  )

  // Force immediate save
  const flushSave = useCallback(async () => {
    if (pendingSaveRef.current) {
      clearTimeout(pendingSaveRef.current)
      pendingSaveRef.current = null
    }
    await savePatch()
  }, [savePatch])

  const refresh = useCallback(async () => {
    await load()
  }, [load])

  const handleBack = () => {
    router.push('/looking-for/my-opportunities/portfolio?status=draft')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex items-center justify-center">
        <div className="text-[13px] text-zinc-500">Loading Studio…</div>
      </div>
    )
  }

  if (error || !draft) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <Warning size={22} className="mx-auto mb-3 text-red-400" />
          <div className="text-[15px] font-bold text-white mb-1">
            Couldn't load draft
          </div>
          <div className="text-[12.5px] text-zinc-500 mb-5">
            {error || "Draft not found or you don't have access."}
          </div>
          <Link
            href="/looking-for/my-opportunities/portfolio"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-zinc-800 hover:border-zinc-700 text-[13px] text-zinc-300 hover:text-white"
          >
            <ArrowLeft size={12} weight="bold" />
            Back to My Opportunities
          </Link>
        </div>
      </div>
    )
  }

  const ctx = {
    draft,
    setDraft,
    updateField,
    flushSave,
    refresh,
    saveStatus,
    lastSavedAt,
    step,
    setStep,
  }

  return (
    <StudioContext.Provider value={ctx}>
      <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex flex-col">
        <StudioHeader onBack={handleBack} />

        <div className="sticky top-[57px] z-20 bg-[#0a0a0b]/95 backdrop-blur-md border-b border-zinc-800/80">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
            <StudioStepNav active={step} onChange={setStep} />
          </div>
        </div>

        <main className="flex-1">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
            {step === 'basics' && <BasicsStep />}
            {step === 'details' && <DetailsStep />}
            {step === 'requirements' && <RequirementsStep />}
            {step === 'application' && <ApplicationStep />}
            {step === 'workflow' && <WorkflowStep />}
            {step === 'distribution' && <DistributionStep />}
            {step === 'review' && <ReviewStep />}
          </div>
        </main>
      </div>
    </StudioContext.Provider>
  )
}