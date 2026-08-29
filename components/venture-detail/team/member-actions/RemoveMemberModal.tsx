'use client'

import { useState } from 'react'
import { CircleNotch, XCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  slug: string
  membership: any
  isSelfLeave?: boolean
  onSuccess: () => void
}

export function RemoveMemberModal({ open, onClose, slug, membership, isSelfLeave, onSuccess }: Props) {
  const [reason, setReason] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const targetName = membership.user?.full_name || 'this member'
  const confirmWord = isSelfLeave ? 'LEAVE' : 'REMOVE'
  const canConfirm = confirmText.trim().toUpperCase() === confirmWord

  const handleRemove = async () => {
    if (!canConfirm) return
    setSaving(true)
    try {
      const res = await fetch(`/api/ventures/${slug}/team/memberships/${membership.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || null })
      })
      if (!res.ok) throw new Error()
      toast.success(isSelfLeave ? 'You have left the venture' : `${targetName} removed`)
      onSuccess()
      onClose()
    } catch {
      toast.error(isSelfLeave ? 'Could not leave venture' : 'Could not remove member')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#121215] border border-white/[0.1] rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <XCircle size={18} className="text-red-400" weight="fill" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-white">
              {isSelfLeave ? 'Leave Venture' : `Remove ${targetName}`}
            </h3>
            <p className="text-[12px] text-zinc-400 mt-0.5 leading-relaxed">
              {isSelfLeave
                ? 'You will lose access to internal venture workspaces. Your contribution history remains preserved.'
                : `${targetName} will immediately lose access. Their contributions remain in the record.`}
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
            placeholder={isSelfLeave ? 'Why are you leaving? (optional)' : 'Why is this member being removed?'}
            rows={3}
            maxLength={500}
            className="w-full p-3 bg-[#0d0d10] border border-white/[0.06] rounded-lg text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15] resize-none"
          />
        </div>

        <div className="mb-4">
          <label className="block text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
            Type <strong className="text-red-400">{confirmWord}</strong> to confirm
          </label>
          <input
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder={confirmWord}
            className="w-full h-10 px-3 bg-[#0d0d10] border border-white/[0.06] rounded-lg text-[13px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-red-500/30 font-mono uppercase"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={saving} className="px-4 h-9 text-[12.5px] font-semibold text-zinc-400 hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleRemove}
            disabled={saving || !canConfirm}
            className="inline-flex items-center gap-1.5 px-5 h-9 bg-red-500/20 border border-red-500/30 text-red-200 hover:bg-red-500/30 rounded-lg text-[12.5px] font-bold disabled:opacity-40 transition-colors"
          >
            {saving && <CircleNotch size={12} className="animate-spin" />}
            {isSelfLeave ? 'Leave Venture' : 'Remove Member'}
          </button>
        </div>
      </div>
    </div>
  )
}