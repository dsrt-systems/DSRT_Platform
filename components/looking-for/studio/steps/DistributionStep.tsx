'use client'

import { useCallback, useEffect, useState } from 'react'
import { Trash, Copy, CheckCircle } from '@phosphor-icons/react'
import { StepFooter } from './StepFooter'
import { useStudio } from '../StudioContext'
import { StudioDistributionPicker } from './parts/StudioDistributionPicker'
import { InfoTooltip } from './parts/InfoTooltip'

const CORE_SURFACES = [
  { type: 'looking_for', label: 'Looking For (Explore)', hint: 'Show on the main Looking For discovery feed.' },
  { type: 'search', label: 'Search', hint: 'Include in global platform search results.' },
  { type: 'recommendations', label: 'Personal Recommendations', hint: 'Allow the recommender to surface this opportunity.' },
]

export function DistributionStep() {
  const { draft, setDraft } = useStudio()
  const oppId = draft.opportunity.id

  const [rows, setRows] = useState<any[] | null>(draft.distribution || null)
  const [busy, setBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/opportunities/${oppId}/distribution`)
    const d = await res.json()
    if (res.ok) {
      setRows(d.distribution || [])
      setDraft((prev) =>
        prev ? { ...prev, distribution: d.distribution || [] } : prev
      )
    }
  }, [oppId, setDraft])

  useEffect(() => {
    if (rows === null) load()
  }, [rows, load])

  const has = (t: string) =>
    (rows || []).some(
      (r: any) =>
        r.destination_type === t &&
        !r.destination_id &&
        r.status === 'active'
    )

  const rowFor = (t: string) =>
    (rows || []).find(
      (r: any) => r.destination_type === t && !r.destination_id
    )

  const toggle = async (t: string) => {
    setBusy(t)
    try {
      if (has(t)) {
        const r = rowFor(t)
        if (r) {
          await fetch(
            `/api/opportunities/${oppId}/distribution?distribution_id=${r.id}`,
            { method: 'DELETE' }
          )
        }
      } else {
        await fetch(`/api/opportunities/${oppId}/distribution`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination_type: t }),
        })
      }
      await load()
    } finally {
      setBusy(null)
    }
  }

  const addTarget = async (
    type: 'project' | 'venture' | 'community',
    id: string
  ) => {
    setBusy('add')
    try {
      await fetch(`/api/opportunities/${oppId}/distribution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination_type: type, destination_id: id }),
      })
      await load()
    } finally {
      setBusy(null)
    }
  }

  const removeSpecific = async (distId: string) => {
    setBusy(distId)
    try {
      await fetch(
        `/api/opportunities/${oppId}/distribution?distribution_id=${distId}`,
        { method: 'DELETE' }
      )
      await load()
    } finally {
      setBusy(null)
    }
  }

  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/looking-for/${
          draft.opportunity.slug || oppId
        }`
      : ''

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  const targeted = (rows || []).filter((r: any) => r.destination_id)

  return (
    <>
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-[20px] font-bold text-white mb-1">
              Distribution
            </h2>
            <p className="text-[12.5px] text-zinc-500">
              Choose where this opportunity is allowed to appear across DSRT.
            </p>
          </div>

          {/* Public link */}
          <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0f0f11] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <label className="flex items-center text-[13px] font-bold text-white mb-1">
              Public link <InfoTooltip text="Share this link anywhere. Users will see the public opportunity page based on your visibility settings." />
            </label>
            <div className="mt-3 flex items-center gap-2">
              <input
                readOnly
                value={publicUrl}
                className="flex-1 h-11 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[13px] text-zinc-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl border border-zinc-800 hover:border-zinc-600 text-[13px] font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle
                      size={14}
                      weight="fill"
                      className="text-emerald-400"
                    />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} weight="regular" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Surfaces */}
          <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0f0f11] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="px-5 py-4 border-b border-zinc-800/80">
              <label className="flex items-center text-[13px] font-bold text-white">
                Surfaces <InfoTooltip text="Turn off surfaces if you only want to distribute via private link or direct invites." />
              </label>
            </div>
            
            {rows === null ? (
              <div className="p-6 space-y-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-12 rounded-lg bg-zinc-900/40 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-zinc-800/70">
                {CORE_SURFACES.map((s) => {
                  const active = has(s.type)
                  return (
                    <li
                      key={s.type}
                      className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-zinc-900/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-semibold text-white">
                          {s.label}
                        </div>
                        <div className="text-[11.5px] text-zinc-500 mt-1">
                          {s.hint}
                        </div>
                      </div>
                      <Toggle
                        value={active}
                        disabled={busy === s.type}
                        onToggle={() => toggle(s.type)}
                      />
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Targeted Destinations */}
          <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0f0f11] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between gap-3">
              <div>
                <label className="text-[13px] font-bold text-white block">
                  Targeted destinations
                </label>
                <p className="text-[11.5px] text-zinc-500 mt-0.5">
                  Attach to specific communities, projects, or ventures.
                </p>
              </div>
              <StudioDistributionPicker
                onSelect={addTarget}
                disabled={busy === 'add' || rows === null}
              />
            </div>
            
            <div className="divide-y divide-zinc-800/70">
              {targeted.length === 0 ? (
                <div className="px-5 py-8 text-center text-[12.5px] text-zinc-500 bg-zinc-950/20">
                  Not distributed to any specific targets yet.
                </div>
              ) : (
                targeted.map((r: any) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-900/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-white capitalize">
                        {String(r.destination_type).replace(/_/g, ' ')}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                        {r.destination_id}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSpecific(r.id)}
                      disabled={busy === r.id}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/25 transition-colors disabled:opacity-50"
                    >
                      <Trash size={12} weight="bold" /> Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-[100px] rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 mb-4">
              Distribution summary
            </h3>
            <SummaryRow label="Explore feed" value={has('looking_for') ? 'On' : 'Off'} />
            <SummaryRow label="Search" value={has('search') ? 'On' : 'Off'} />
            <SummaryRow label="Recommendations" value={has('recommendations') ? 'On' : 'Off'} />
            <div className="my-3 border-t border-zinc-800/70" />
            <SummaryRow label="Targeted entities" value={targeted.length} />
          </div>
        </div>
      </div>
      
      <StepFooter prev="workflow" next="review" />
    </>
  )
}

function Toggle({
  value,
  onToggle,
  disabled,
}: {
  value: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={
        'relative w-10 h-6 rounded-full transition-colors shrink-0 ' +
        (value ? 'bg-white' : 'bg-zinc-800')
      }
      aria-pressed={value}
    >
      <span
        className={
          'absolute top-0.5 w-5 h-5 rounded-full transition-all ' +
          (value ? 'left-4 bg-black' : 'left-0.5 bg-zinc-500')
        }
      />
    </button>
  )
}

function SummaryRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between items-center py-1.5 text-[12.5px]">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-200 font-semibold">{String(value)}</span>
    </div>
  )
}