'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Warning } from '@phosphor-icons/react'
import { AppStudioContext, type AppDraft, type SaveStatus, type AppStep } from './AppStudioContext'
import { AppStudioHeader } from './AppStudioHeader'
import { AppStudioNav } from './AppStudioNav'

// Real Step Components (All Phases Complete)
import { ProfileStep } from './steps/ProfileStep'
import { ExperienceStep } from './steps/ExperienceStep'
import { QuestionsStep } from './steps/QuestionsStep'
import { EvidenceStep } from './steps/EvidenceStep'
import { ReviewStep } from './steps/ReviewStep'

export function AppStudioShell({ opportunityId, applicationId }: { opportunityId: string; applicationId: string }) {
  const router = useRouter()
  const sp = useSearchParams()

  const [draft, setDraft] = useState<AppDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const initialStep = (sp.get('step') as AppStep) || 'profile'
  const [step, setStep] = useState<AppStep>(initialStep)

  const pendingSaveRef = useRef<NodeJS.Timeout | null>(null)
  const pendingPatchRef = useRef<Record<string, any>>({})
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/opportunities/applications/${applicationId}/draft`, { cache: 'no-store' })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'Failed to load application')
      setDraft(d)
    } catch (e: any) {
      setError(e?.message)
    } finally {
      setLoading(false)
    }
  }, [applicationId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const p = new URLSearchParams(sp.toString())
    if (step === 'profile') p.delete('step')
    else p.set('step', step)
    const qs = p.toString()
    router.replace(`/looking-for/${opportunityId}/apply/${applicationId}${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [step, opportunityId, applicationId, sp, router])

  const savePatch = useCallback(async () => {
    const patch = pendingPatchRef.current
    if (Object.keys(patch).length === 0) return
    pendingPatchRef.current = {}
    setSaveStatus('saving')

    try {
      const res = await fetch(`/api/opportunities/applications/${applicationId}/draft`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patch,
          expected_updated_at: draft?.application?.updated_at,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        if (d?.code === 'stale' && mountedRef.current) {
          setSaveStatus('error')
          await load()
          return
        }
        throw new Error(d?.error || 'Save failed')
      }
      if (mountedRef.current) {
        setDraft((prev) =>
          prev
            ? {
                ...prev,
                application: { ...prev.application, ...patch, updated_at: d.updated_at },
              }
            : prev
        )
        setLastSavedAt(new Date())
        setSaveStatus('saved')
      }
    } catch {
      if (mountedRef.current) setSaveStatus('error')
    }
  }, [applicationId, draft?.application?.updated_at, load])

  const updateField = useCallback(
    (patch: Record<string, any>) => {
      if (!draft) return
      setDraft((prev) => (prev ? { ...prev, application: { ...prev.application, ...patch } } : prev))
      pendingPatchRef.current = { ...pendingPatchRef.current, ...patch }

      if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current)
      pendingSaveRef.current = setTimeout(() => {
        savePatch()
      }, 800)
    },
    [draft, savePatch]
  )

  const flushSave = useCallback(async () => {
    if (pendingSaveRef.current) {
      clearTimeout(pendingSaveRef.current)
      pendingSaveRef.current = null
    }
    await savePatch()
  }, [savePatch])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex items-center justify-center">
        <div className="text-[13px] text-zinc-500">Loading Application Studio…</div>
      </div>
    )
  }

  if (error || !draft) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex items-center justify-center">
        <div className="text-center px-6">
          <Warning size={24} className="mx-auto mb-3 text-red-400" />
          <div className="text-[15px] font-bold text-white mb-2">{error || 'Application not found'}</div>
          <Link
            href={`/looking-for/${opportunityId}`}
            className="h-9 px-4 rounded-xl border border-zinc-800 text-[13px] text-zinc-300 hover:text-white inline-flex items-center"
          >
            <ArrowLeft size={12} className="mr-1.5" /> Back to Opportunity
          </Link>
        </div>
      </div>
    )
  }

  return (
    <AppStudioContext.Provider
      value={{ draft, setDraft, updateField, flushSave, saveStatus, lastSavedAt, step, setStep }}
    >
      <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex flex-col">
        <AppStudioHeader />

        <div className="sticky top-[57px] z-20 bg-[#0a0a0b]/95 backdrop-blur-md border-b border-zinc-800/80">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
            <AppStudioNav />
          </div>
        </div>

        <main className="flex-1">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
            {step === 'profile' && <ProfileStep />}
            {step === 'experience' && <ExperienceStep />}
            {step === 'questions' && <QuestionsStep />}
            {step === 'evidence' && <EvidenceStep />}
            {step === 'review' && <ReviewStep />}
          </div>
        </main>
      </div>
    </AppStudioContext.Provider>
  )
}