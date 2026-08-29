'use client'

import { useState } from 'react'
import { X, PencilSimple, Link as LinkIcon, UserPlus, Trash, Shield, Plus, Key } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Props {
  position: any | null
  memberships: any[]
  isOwner: boolean
  slug: string
  onRefresh: () => void
  onClose: () => void
  onEdit: (position: any) => void
  onInvite: (position: any) => void
  onDelete: (id: string) => void
  onLinkOpportunity: (position: any) => void
}

export function PositionInspector({
  position,
  memberships,
  isOwner,
  slug,
  onRefresh,
  onClose,
  onEdit,
  onInvite,
  onDelete,
  onLinkOpportunity,
}: Props) {
  const [newResponsibility, setNewResponsibility] = useState('')
  const [newSkill, setNewSkill] = useState('')

  if (!position) {
    return (
      <div className="bg-[#121215] border border-white/[0.06] rounded-2xl h-[600px] p-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
          <PencilSimple size={20} className="text-zinc-600" />
        </div>
        <p className="text-[13px] font-semibold text-white">No Position Selected</p>
        <p className="text-[12px] text-zinc-500 mt-1">Select a node on the organizational canvas to view metadata.</p>
      </div>
    )
  }

  const handleAddResponsibility = async () => {
    if (!newResponsibility.trim()) return
    const updated = [...(position.responsibilities || []), newResponsibility.trim()]
    try {
      const res = await fetch(`/api/ventures/${slug}/team/positions/${position.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responsibilities: updated })
      })
      if (!res.ok) throw new Error()
      setNewResponsibility('')
      onRefresh()
      toast.success('Responsibilities updated')
    } catch {
      toast.error('Could not append responsibility')
    }
  }

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return
    const updated = [...(position.required_skills || []), newSkill.trim()]
    try {
      const res = await fetch(`/api/ventures/${slug}/team/positions/${position.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ required_skills: updated })
      })
      if (!res.ok) throw new Error()
      setNewSkill('')
      onRefresh()
      toast.success('Skills tag appended')
    } catch {
      toast.error('Could not append skills block')
    }
  }

  const isOccupied = memberships.length > 0

  return (
    <div className="bg-[#121215] border border-white/[0.06] rounded-2xl h-[600px] flex flex-col overflow-hidden">
      {/* Header Panel */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            {position.position_type.replace('_', ' ')}
          </span>
          <h3 className="text-[15px] font-bold text-white mt-0.5">{position.title}</h3>
        </div>
        <button 
          onClick={onClose} 
          className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Inspector Details Body */}
      <div className="p-5 flex-1 overflow-y-auto space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-zinc-500 mb-1">Status</p>
            <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-800 text-zinc-300 capitalize">
              {position.status.replace('_', ' ')}
            </span>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 mb-1">Team / Department</p>
            <p className="text-[13px] text-white font-medium truncate">{position.team_name || position.department || '—'}</p>
          </div>
        </div>

        {/* Primary Occupant Information */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold mb-3">
            Occupants ({memberships.length}/{position.capacity})
          </p>
          {memberships.length === 0 ? (
            <div className="p-3 border border-dashed border-zinc-700 rounded-lg text-center">
              <p className="text-[12px] text-zinc-500">Empty role representation</p>
            </div>
          ) : (
            <div className="space-y-2">
              {memberships.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-2.5 bg-[#09090b] border border-white/[0.04] rounded-lg">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
                    {m.user?.avatar_url ? <img src={m.user.avatar_url} className="w-full h-full object-cover" alt="" /> : m.user?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white truncate">{m.user?.full_name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">@{m.user?.username || 'member'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inline editable responsibilities tags */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">Core Responsibilities</p>
          <div className="space-y-1">
            {(position.responsibilities || []).map((resp: string, idx: number) => (
              <div key={idx} className="text-[12px] text-zinc-300 bg-white/[0.02] border border-white/[0.04] p-2 rounded-lg">
                • {resp}
              </div>
            ))}
          </div>
          {isOwner && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newResponsibility}
                onChange={e => setNewResponsibility(e.target.value)}
                placeholder="Append responsibility..."
                className="flex-1 h-8 px-2.5 bg-[#09090b] border border-zinc-800 rounded text-[12px] text-white focus:outline-none"
              />
              <button onClick={handleAddResponsibility} className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white text-xs">
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Inline editable skills tags */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">Required Skills</p>
          <div className="flex flex-wrap gap-1">
            {(position.required_skills || []).map((skill: string, idx: number) => (
              <span key={idx} className="text-[10.5px] font-mono px-2 py-0.5 bg-zinc-900 border border-white/[0.04] text-zinc-400 rounded-md">
                {skill}
              </span>
            ))}
          </div>
          {isOwner && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                placeholder="Append skill tag..."
                className="flex-1 h-8 px-2.5 bg-[#09090b] border border-zinc-800 rounded text-[12px] text-white focus:outline-none"
              />
              <button onClick={handleAddSkill} className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white text-xs">
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Primary owner editing actions bar */}
      {isOwner && (
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 space-y-2">
          {!isOccupied && position.position_type !== 'team_group' && (
            <button 
              onClick={() => onInvite(position)}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-white text-black text-[12.5px] font-bold hover:bg-zinc-200 transition-colors"
            >
              <UserPlus size={14} weight="bold" /> Invite Member
            </button>
          )}
          <div className="flex gap-2">
            <button 
              onClick={() => onEdit(position)}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md bg-zinc-800 hover:bg-zinc-700 text-[12px] font-semibold text-zinc-300 transition-colors"
            >
              <PencilSimple size={12} /> Edit
            </button>
            {position.position_type !== 'team_group' && (
              <button 
                onClick={() => onLinkOpportunity(position)}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md bg-zinc-800 hover:bg-zinc-700 text-[12px] font-semibold text-zinc-300 transition-colors"
              >
                <LinkIcon size={12} /> {position.linked_opportunity_id ? 'Manage Link' : 'Link Role'}
              </button>
            )}
            <button 
              onClick={() => {
                if(confirm('Are you sure you want to remove this node representation?')) {
                  onDelete(position.id)
                }
              }}
              className="w-8 h-8 rounded-md bg-zinc-800 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors"
            >
              <Trash size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}