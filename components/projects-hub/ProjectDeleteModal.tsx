'use client'

import { useState } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Props {
  project: { id: string; slug: string; name: string } | null
  onClose: () => void
  onDeleted: (id: string) => void
}

export function ProjectDeleteModal({ project, onClose, onDeleted }: Props) {
  const [confirmInput, setConfirmInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  if (!project) return null

  const handleConfirm = async () => {
    if (confirmInput.trim() !== project.name.trim()) {
      toast.error('Project name does not match')
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${project.slug}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to archive project')

      toast.success('Project archived')
      onDeleted(project.id)
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Could not archive project')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#121215] border border-white/[0.1] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-[16px] font-bold text-white">Archive project?</h3>
        <p className="text-[12.5px] text-zinc-400 leading-relaxed">
          This will archive <strong className="text-white">{project.name}</strong>. Archived
          projects are hidden from Explore but remain accessible in your Archive tab.
          You can restore them later.
        </p>

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
            Type "{project.name}" to confirm
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={e => setConfirmInput(e.target.value)}
            placeholder={project.name}
            className="w-full h-10 px-3 bg-[#09090b] border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 h-9 text-[12.5px] font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting || confirmInput.trim() !== project.name.trim()}
            className="px-4 h-9 bg-red-500/20 border border-red-500/40 text-red-300 font-bold rounded-lg text-[12.5px] hover:bg-red-500/30 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {deleting ? (
              <>
                <CircleNotch size={14} className="animate-spin" />
                Archiving
              </>
            ) : (
              'Archive project'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}