'use client'

import { useState } from 'react'
import { X, CircleNotch, WarningCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  slug: string
  membership: any
  onSuccess: () => void
}

export function SuspendMemberModal({ open, onClose, slug, membership, onSuccess }: Props) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const handleSuspend = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/ventures/${slug}/team/memberships/${membership.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || null })
      })
      if (!res.ok) throw new Error()
      toast.success('Member suspended')
      onSuccess()
      onClose()
    } catch {
      toast.error('Could not suspend member')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#121215] border border-white/[0.1] rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <WarningCircle size={18} className="text-amber-400" weight="fill" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-white">Suspend Access</h3>
            <p className="text-[12px] text-zinc-400 mt-0.5">
              Temporarily revoke access for <strong className="text-white">{membership.user?.full_name}</strong>. They can be restored anytime.
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
            Reason (Optional)
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Contract paused for Q2, investigation pending..."
            rows={3}
            maxLength={500}
            className="w-full p-3 bg-[#0d0d10] border border-white/[0.06] rounded-lg text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15] resize-none"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={saving} className="px-4 h-9 text-[12.5px] font-semibold text-zinc-400 hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleSuspend}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 h-9 bg-amber-500/20 border border-amber-500/30 text-amber-200 hover:bg-amber-500/30 rounded-lg text-[12.5px] font-bold disabled:opacity-40 transition-colors"
          >
            {saving && <CircleNotch size={12} className="animate-spin" />}
            Suspend Access
          </button>
        </div>
      </div>
    </div>
  )
}