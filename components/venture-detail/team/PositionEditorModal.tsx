'use client'

import { useState, useEffect } from 'react'
import { X, CircleNotch } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  slug: string
  existingPosition?: any | null
  onSuccess: () => void
}

export function PositionEditorModal({ open, onClose, slug, existingPosition, onSuccess }: Props) {
  const [title, setTitle] = useState('')
  const [positionType, setPositionType] = useState('employee')
  const [department, setDepartment] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existingPosition) {
      setTitle(existingPosition.title || '')
      setPositionType(existingPosition.position_type || 'employee')
      setDepartment(existingPosition.department || '')
    } else {
      setTitle('')
      setPositionType('employee')
      setDepartment('')
    }
  }, [existingPosition, open])

  if (!open) return null

  const handleSave = async () => {
    if (!title.trim()) return toast.error('Title is required')
    setSaving(true)

    try {
      const url = existingPosition 
        ? `/api/ventures/${slug}/team/positions/${existingPosition.id}`
        : `/api/ventures/${slug}/team/positions`
      
      const method = existingPosition ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          position_type: positionType,
          department: department.trim() || null,
          status: existingPosition ? undefined : 'open'
        })
      })

      if (!res.ok) throw new Error('Failed to save position')
      
      toast.success(existingPosition ? 'Position updated' : 'Position representation created')
      onSuccess()
      onClose()
    } catch (e) {
      toast.error('Could not save structural position')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#121215] border border-white/[0.1] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
          <h2 className="text-[15px] font-bold text-white">
            {existingPosition ? 'Edit Position' : 'Create New Structural Unit'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16} /></button>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-white mb-1.5">Position Title *</label>
            <input 
              autoFocus
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Lead Product Designer"
              className="w-full h-10 px-3 bg-[#09090b] border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none focus:border-zinc-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-white mb-1.5">Type</label>
              <select 
                value={positionType} 
                onChange={e => setPositionType(e.target.value)}
                className="w-full h-10 px-3 bg-[#09090b] border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="founder">Founder</option>
                <option value="executive">Executive</option>
                <option value="employee">Employee</option>
                <option value="contractor">Contractor</option>
                <option value="advisor">Advisor</option>
                <option value="team_group">Department Group</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-white mb-1.5">Team / Dept</label>
              <input 
                value={department} 
                onChange={e => setDepartment(e.target.value)} 
                placeholder="e.g. Engineering"
                className="w-full h-10 px-3 bg-[#09090b] border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 h-9 text-[12.5px] font-semibold text-zinc-400 hover:text-white">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={saving || !title.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-5 h-9 bg-white text-black rounded-lg text-[12.5px] font-bold hover:bg-zinc-200 disabled:opacity-50"
          >
            {saving ? <CircleNotch size={14} className="animate-spin" /> : 'Save Node Position'}
          </button>
        </div>
      </div>
    </div>
  )
}