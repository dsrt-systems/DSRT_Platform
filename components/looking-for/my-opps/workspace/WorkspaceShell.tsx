'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Eye, PencilSimple, Warning } from '@phosphor-icons/react'
import { WorkspaceHeader } from './WorkspaceHeader'
import { WorkspaceTabs, type WorkspaceTab } from './WorkspaceTabs'
import { OverviewTab } from './tabs/OverviewTab'
import { ApplicantsTab } from './tabs/ApplicantsTab'
import { PipelineTab } from './tabs/PipelineTab'
import { MessagesTab } from './tabs/MessagesTab'
import { PerformanceTab } from './tabs/PerformanceTab'
import { DistributionTab } from './tabs/DistributionTab'
import { ActivityTab } from './tabs/ActivityTab'
import { AutomationTab } from './tabs/AutomationTab'
import { ComplianceTab } from './tabs/ComplianceTab'
import { SettingsTab } from './tabs/SettingsTab'

export function WorkspaceShell({ opportunityId }: { opportunityId: string }) {
  const router = useRouter()
  const sp = useSearchParams()
  const initialTab = (sp.get('tab') as WorkspaceTab) || 'overview'

  const [tab, setTab] = useState<WorkspaceTab>(initialTab)
  const [opp, setOpp] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'Failed')
      }
      setOpp(await res.json())
    } catch (e: any) {
      setError(e?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }, [opportunityId])

  useEffect(() => {
    load()
  }, [load])

  const changeTab = (t: WorkspaceTab) => {
    setTab(t)
    const p = new URLSearchParams(sp.toString())
    if (t === 'overview') p.delete('tab')
    else p.set('tab', t)
    const qs = p.toString()
    router.replace(
      `/looking-for/my-opportunities/${opportunityId}${qs ? `?${qs}` : ''}`,
      { scroll: false }
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-zinc-100">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-4">
          <div className="h-8 w-1/3 rounded bg-zinc-900 animate-pulse" />
          <div className="h-4 w-1/4 rounded bg-zinc-900 animate-pulse" />
          <div className="h-10 rounded bg-zinc-900 animate-pulse" />
          <div className="h-64 rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0f0f11] animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !opp) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <Warning size={20} className="mx-auto mb-3 text-red-400" />
          <div className="text-[15px] font-bold text-white mb-1">{error || 'Not found'}</div>
          <Link
            href="/looking-for/my-opportunities"
            className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-zinc-800 text-[13px] text-zinc-300 hover:text-white"
          >
            <ArrowLeft size={12} weight="bold" />
            Back to My Opportunities
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100">
      <div className="sticky top-0 z-30 bg-[#0a0a0b]/95 backdrop-blur-md border-b border-zinc-800/80">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-2 pt-4">
            <Link
              href="/looking-for/my-opportunities/portfolio"
              className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-400 hover:text-white"
            >
              <ArrowLeft size={12} weight="bold" />
              My Opportunities
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href={`/looking-for/${opp.slug || opp.id}`}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-zinc-800 hover:border-zinc-600 text-[12.5px] font-medium text-zinc-300 hover:text-white"
              >
                <Eye size={12} weight="regular" />
                View public
              </Link>
              <Link
                href={`/looking-for/create?edit=${opp.id}`}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-zinc-800 hover:border-zinc-600 text-[12.5px] font-medium text-zinc-300 hover:text-white"
              >
                <PencilSimple size={12} weight="regular" />
                Edit
              </Link>
            </div>
          </div>

          <WorkspaceHeader opp={opp} />
          <WorkspaceTabs active={tab} onChange={changeTab} />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6">
        {tab === 'overview' && (
          <OverviewTab opp={opp} onChangeTab={changeTab} onRefresh={load} />
        )}
        {tab === 'applicants' && <ApplicantsTab opportunityId={opp.id} />}
        {tab === 'pipeline' && <PipelineTab opportunityId={opp.id} />}
        {tab === 'messages' && <MessagesTab opportunityId={opp.id} />}
        {tab === 'performance' && <PerformanceTab opportunityId={opp.id} />}
        {tab === 'distribution' && <DistributionTab opportunityId={opp.id} />}
        {tab === 'activity' && <ActivityTab opportunityId={opp.id} />}
        {tab === 'automation' && <AutomationTab opportunityId={opp.id} />}
        {tab === 'compliance' && <ComplianceTab opportunityId={opp.id} />}
        {tab === 'settings' && <SettingsTab opp={opp} onRefresh={load} />}
      </div>
    </div>
  )
}