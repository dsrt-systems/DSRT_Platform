'use client'

import { useState, useEffect } from 'react'
import { X, CircleNotch, Link as LinkIcon, LinkBreak } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  slug: string
  opportunity: any
  positions: any[]
  onSuccess: () => void
}

export function LinkPositionModal({
  open, onClose, slug, opportunity, positions, onSuccess
}: Props) {
  const [selectedPositionId, setSelectedPositionId] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Pre-select currently linked position if any
    const currentPos = positions.find(p => p.linked_opportunity_id === opportunity?.id)
    setSelectedPositionId(currentPos?.id || '')
  }, [opportunity, positions, open])

  if (!open || !opportunity) return null

  // Only show positions that are either unlinked, or already linked to THIS opportunity
  const availablePositions = positions.filter(p =>
    !p.linked_opportunity_id || p.linked_opportunity_id === opportunity.id
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      // Find current linked position (if any) and unlink it
      const currentPos = positions.find(p => p.linked_opportunity_id === opportunity.id)

      if (currentPos && currentPos.id !== selectedPositionId) {
        // Unlink previous position
        await fetch(`/api/ventures/${slug}/team/positions/${currentPos.id}/link`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opportunity_id: null })
        })
      }

      // Link new position (or unlink completely)
      if (selectedPositionId) {
        const res = await fetch(`/api/ventures/${slug}/team/positions/${selectedPositionId}/link`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opportunity_id: opportunity.id })
        })
        if (!res.ok) throw new Error('Failed to link')
        toast.success('Position linked to opportunity')
      } else {
        toast.success('Opportunity unlinked')
      }

      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Could not update link')
    } finally {
      setSaving(false)
    }
  }

  const currentLinkedPos = positions.find(p => p.linked_opportunity_id === opportunity.id)

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#121215] border border-white/[0.1] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-white">Link to Team Position</h3>
            <p className="text-[11.5px] text-zinc-500 mt-0.5 truncate max-w-[280px]">
              {opportunity.title}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-zinc-500 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-[12.5px] text-zinc-400 leading-relaxed">
            Linking this opportunity to a team position enables automatic capacity sync.
            When a member joins the position, the opportunity's remaining openings decrement automatically.
          </p>

          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {/* Unlink option */}
            <button
              onClick={() => setSelectedPositionId('')}
              className={
                'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ' +
                (selectedPositionId === ''
                  ? 'border-white/20 bg-white/[0.06]'
                  : 'border-white/[0.06] bg-[#0d0d10] hover:border-white/[0.12]')
              }
            >
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                <LinkBreak size={14} className="text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white">No Link</p>
                <p className="text-[10.5px] text-zinc-500 mt-0.5">
                  Opportunity operates independently (manual capacity)
                </p>
              </div>
            </button>

            {availablePositions.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-white/[0.06] text-center">
                <p className="text-[12px] text-zinc-500">
                  No open positions available. Create one in the Team Graph first.
                </p>
              </div>
            ) : (
              availablePositions.map(p => {
                const remaining = (p.capacity || 1) - (p.occupied_count || 0)
                const selected = selectedPositionId === p.id
                const isCurrent = p.linked_opportunity_id === opportunity.id
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPositionId(p.id)}
                    className={
                      'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ' +
                      (selected
                        ? 'border-white/20 bg-white/[0.06]'
                        : 'border-white/[0.06] bg-[#0d0d10] hover:border-white/[0.12]')
                    }
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                      <LinkIcon size={14} className={isCurrent ? 'text-emerald-400' : 'text-zinc-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-bold text-white truncate">{p.title}</p>
                        {isCurrent && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-zinc-500 truncate mt-0.5">
                        {p.team_name || 'General'} · {remaining}/{p.capacity || 1} open
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-white/[0.06] bg-[#0d0d10] flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 h-9 text-[12.5px] font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 h-9 bg-white text-black rounded-lg text-[12.5px] font-bold hover:bg-zinc-200 disabled:opacity-50"
          >
            {saving ? <CircleNotch size={13} className="animate-spin" /> : 'Save Link'}
          </button>
        </div>
      </div>
    </div>
  )
}