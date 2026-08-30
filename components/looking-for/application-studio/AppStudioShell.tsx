'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Warning } from '@phosphor-icons/react'
import { AppStudioContext, type AppDraft, type SaveStatus, type AppStep } from './AppStudioContext'
import { AppStudioHeader } from './AppStudioHeader'
import { AppStudioNav } from './AppStudioNav'
import { ProfileStep } from './steps/ProfileStep'
import { ExperienceStep } from './steps/ExperienceStep'
import { QuestionsStep } from './steps/QuestionsStep'
import { EvidenceStep } from './steps/EvidenceStep'
import { ReviewStep } from './steps/ReviewStep'

const VALID_STEPS: AppStep[] = ['profile', 'experience', 'questions', 'evidence', 'review']

function normalizeStep(raw: string | null): AppStep {
  if (raw && (VALID_STEPS as string[]).includes(raw)) return raw as AppStep
  return 'profile'
}

export function AppStudioShell({
  opportunityId,
  applicationId,
}: {
  opportunityId: string
  applicationId: string
}) {
  const router = useRouter()
  const sp = useSearchParams()

  const [draft, setDraft] = useState<AppDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [step, setStep] = useState<AppStep>(() => normalizeStep(sp.get('step')))

  const pendingSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingPatchRef = useRef<Record<string, any>>({})
  const mountedRef = useRef(true)
  const savingRef = useRef(false)
  const draftRef = useRef<AppDraft | null>(null)
  const lastStepInUrlRef = useRef<string | null>(sp.get('step'))

  // Keep ref in sync for save closures
  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/opportunities/applications/${applicationId}/draft`,
        { cache: 'no-store' }
      )
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'Failed to load application')
      if (mountedRef.current) {
        setDraft(d)
        draftRef.current = d
      }
    } catch (e: any) {
      if (mountedRef.current) setError(e?.message || 'Failed to load application')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [applicationId])

  // Load once per applicationId — never on a timer
  useEffect(() => {
    load()
  }, [load])

  // URL sync: only when step actually changes — do NOT depend on `sp` object
  useEffect(() => {
    const desired = step === 'profile' ? null : step
    if (lastStepInUrlRef.current === desired) return
    lastStepInUrlRef.current = desired

    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    if (step === 'profile') p.delete('step')
    else p.set('step', step)
    const qs = p.toString()
    router.replace(
      `/looking-for/${opportunityId}/apply/${applicationId}${qs ? `?${qs}` : ''}`,
      { scroll: false }
    )
  }, [step, opportunityId, applicationId, router])

  const savePatch = useCallback(async () => {
    if (savingRef.current) return

    const patch = { ...pendingPatchRef.current }
    if (Object.keys(patch).length === 0) return

    // Clear queued patch up-front; anything typed during save will re-queue
    pendingPatchRef.current = {}
    savingRef.current = true
    if (mountedRef.current) setSaveStatus('saving')

    try {
      const res = await fetch(
        `/api/opportunities/applications/${applicationId}/draft`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patch }),
        }
      )
      const d = await res.json().catch(() => ({}))

      if (!res.ok) {
        // Put failed patch back so a later keystroke / flush can retry
        pendingPatchRef.current = { ...patch, ...pendingPatchRef.current }
        throw new Error(d?.error || 'Save failed')
      }

      if (mountedRef.current) {
        setDraft((prev) => {
          if (!prev) return prev
          const next = {
            ...prev,
            application: {
              ...prev.application,
              ...patch,
              updated_at: d.updated_at || prev.application?.updated_at,
            },
          }
          draftRef.current = next
          return next
        })
        setLastSavedAt(new Date())
        setSaveStatus('saved')
      }

      // If user typed while we were saving, schedule another save
      if (Object.keys(pendingPatchRef.current).length > 0) {
        if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current)
        pendingSaveRef.current = setTimeout(() => {
          savePatch()
        }, 500)
      }
    } catch {
      if (mountedRef.current) setSaveStatus('error')
    } finally {
      savingRef.current = false
    }
  }, [applicationId])

  const updateField = useCallback(
    (patch: Record<string, any>) => {
      // Optimistic local merge — never wipe sibling fields
      setDraft((prev) => {
        if (!prev) return prev
        const next = {
          ...prev,
          application: { ...prev.application, ...patch },
        }
        draftRef.current = next
        return next
      })

      pendingPatchRef.current = { ...pendingPatchRef.current, ...patch }

      if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current)
      pendingSaveRef.current = setTimeout(() => {
        savePatch()
      }, 800)
    },
    [savePatch]
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
          <div className="text-[15px] font-bold text-white mb-2">
            {error || 'Application not found'}
          </div>
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
      value={{
        draft,
        setDraft,
        updateField,
        flushSave,
        saveStatus,
        lastSavedAt,
        step,
        setStep,
      }}
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