'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, DotsThree, Eye, PencilSimple, Warning,
} from '@phosphor-icons/react'
import { ApplicantCard } from './ApplicantCard'
import { ApplicantDetailModal } from './ApplicantDetailModal'

interface Props {
  opportunityId: string
}

const STAGES = [
  { key: 'submitted', label: 'New', color: 'zinc' },
  { key: 'under-review', label: 'Reviewing', color: 'blue' },
  { key: 'shortlisted', label: 'Shortlisted', color: 'cyan' },
  { key: 'interview', label: 'Interview', color: 'purple' },
  { key: 'accepted', label: 'Accepted', color: 'emerald' },
  { key: 'declined', label: 'Declined', color: 'red' },
]

export function ApplicantsWorkspace({ opportunityId }: Props) {
  const router = useRouter()
  const [opportunity, setOpportunity] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [activeStage, setActiveStage] = useState<string>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [oppRes, appsRes] = await Promise.all([
        fetch(`/api/opportunities/${opportunityId}`),
        fetch(`/api/opportunities/${opportunityId}/applicants`),
      ])
      if (!oppRes.ok) throw new Error('Opportunity not found')
      const oppData = await oppRes.json()
      const appsData = appsRes.ok ? await appsRes.json() : { applications: [], stats: {} }

      setOpportunity(oppData)
      setApplications(appsData.applications || [])
      setStats(appsData.stats || {})
    } catch (e: any) {
      setError(e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [opportunityId])

  useEffect(() => { load() }, [load])

  const updateApplication = async (appId: string, patch: any) => {
    // Optimistic
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, ...patch } : a))
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/applicants/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Update failed')
      await load()
    } catch {
      await load()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[13px] text-zinc-500">Loading applicants...</div>
      </div>
    )
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Warning size={20} className="mx-auto mb-3 text-red-400" />
          <h1 className="text-[16px] font-bold text-white mb-1">{error || 'Not found'}</h1>
          <Link
            href="/looking-for?tab=my-opportunities"
            className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-zinc-800 hover:border-zinc-700 text-[13px] text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={12} weight="bold" />
            Back to My Opportunities
          </Link>
        </div>
      </div>
    )
  }

  const selectedApp = applications.find(a => a.id === selectedAppId)

  const filteredApps = activeStage === 'all'
    ? applications
    : applications.filter(a => a.pipeline_stage === activeStage)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur border-b border-zinc-800">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <button
              onClick={() => router.push('/looking-for?tab=my-opportunities')}
              className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={12} weight="bold" />
              My Opportunities
            </button>
            <div className="flex items-center gap-2">
              <Link
                href={`/looking-for/${opportunity.slug}`}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-zinc-800 hover:border-zinc-700 text-[12.5px] font-medium text-zinc-300 hover:text-white transition-colors"
              >
                <Eye size={12} weight="regular" />
                View public
              </Link>
              <Link
                href={`/looking-for/create?edit=${opportunity.id}`}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-zinc-800 hover:border-zinc-700 text-[12.5px] font-medium text-zinc-300 hover:text-white transition-colors"
              >
                <PencilSimple size={12} weight="regular" />
                Edit
              </Link>
            </div>
          </div>

          <div className="mb-1">
            <h1 className="text-[20px] md:text-[22px] font-bold text-white leading-tight">
              {opportunity.title}
            </h1>
            <p className="text-[12.5px] text-zinc-500 mt-0.5">
              {stats.total || 0} total applicants · {opportunity.view_count || 0} views · {opportunity.save_count || 0} saves
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6">
        {applications.length === 0 ? (
          <EmptyApplicants />
        ) : (
          <>
            {/* Stage filter chips */}
            <div className="flex items-center gap-1 mb-5 overflow-x-auto scrollbar-hide">
              <StageChip
                label="All"
                count={stats.total || 0}
                active={activeStage === 'all'}
                onClick={() => setActiveStage('all')}
              />
              {STAGES.map(s => (
                <StageChip
                  key={s.key}
                  label={s.label}
                  count={stats[s.key] || 0}
                  active={activeStage === s.key}
                  color={s.color}
                  onClick={() => setActiveStage(s.key)}
                />
              ))}
            </div>

            {/* Kanban board */}
            {activeStage === 'all' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {STAGES.map(s => (
                  <KanbanColumn
                    key={s.key}
                    stage={s}
                    applications={applications.filter(a => a.pipeline_stage === s.key)}
                    onSelect={setSelectedAppId}
                    onMove={(appId, newStage) => updateApplication(appId, { pipeline_stage: newStage })}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredApps.length === 0 ? (
                  <div className="col-span-full rounded-xl border border-dashed border-zinc-800 p-8 text-center">
                    <p className="text-[13px] text-zinc-500">
                      No applicants in this stage
                    </p>
                  </div>
                ) : (
                  filteredApps.map(app => (
                    <ApplicantCard
                      key={app.id}
                      application={app}
                      onClick={() => setSelectedAppId(app.id)}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail modal */}
      {selectedApp && (
        <ApplicantDetailModal
          application={selectedApp}
          opportunityId={opportunityId}
          onClose={() => setSelectedAppId(null)}
          onUpdate={updateApplication}
        />
      )}
    </div>
  )
}

function KanbanColumn({
  stage, applications, onSelect, onMove,
}: {
  stage: { key: string; label: string; color: string }
  applications: any[]
  onSelect: (id: string) => void
  onMove: (appId: string, newStage: string) => void
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/30">
      <div className="px-3 py-2.5 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          {stage.label}
        </span>
        <span className="text-[10.5px] font-bold text-zinc-500 h-5 min-w-[20px] px-1.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          {applications.length}
        </span>
      </div>
      <div className="p-2 space-y-2 min-h-[100px] max-h-[70vh] overflow-y-auto scrollbar-hide">
        {applications.length === 0 ? (
          <div className="py-6 text-center text-[11px] text-zinc-600 italic">Empty</div>
        ) : (
          applications.map(app => (
            <ApplicantCard
              key={app.id}
              application={app}
              compact
              onClick={() => onSelect(app.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function StageChip({
  label, count, active, color, onClick,
}: {
  label: string
  count: number
  active: boolean
  color?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={
        'inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ' +
        (active
          ? 'bg-zinc-800 text-white'
          : 'text-zinc-400 hover:text-white hover:bg-zinc-900')
      }
    >
      {label}
      {count > 0 && (
        <span className={
          'text-[10.5px] font-bold ' +
          (active ? 'text-zinc-400' : 'text-zinc-600')
        }>
          {count}
        </span>
      )}
    </button>
  )
}

function EmptyApplicants() {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 p-16 text-center">
      <h2 className="text-[16px] font-bold text-white mb-1.5">No applicants yet</h2>
      <p className="text-[12.5px] text-zinc-500 max-w-md mx-auto leading-relaxed">
        When people apply to this opportunity, they'll appear here. Share the opportunity to attract applicants.
      </p>
    </div>
  )
}