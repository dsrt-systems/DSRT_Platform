'use client'

import { X, PencilSimple, Link as LinkIcon, UserPlus, Trash } from '@phosphor-icons/react'

interface Props {
  position: any | null
  memberships: any[]
  isOwner: boolean
  slug: string
  onRefresh: () => void
  onClose: () => void
  
  // NEW EXPORTS FOR PHASE 4
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
  if (!position) {
    return (
      <div className="bg-[#121215] border border-white/[0.06] rounded-2xl h-[600px] p-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
          <PencilSimple size={20} className="text-zinc-600" />
        </div>
        <p className="text-[13px] font-semibold text-white">No position selected</p>
        <p className="text-[12px] text-zinc-500 mt-1">Select a node on the canvas to view details.</p>
      </div>
    )
  }

  const isOccupied = memberships.length > 0

  return (
    <div className="bg-[#121215] border border-white/[0.06] rounded-2xl h-[600px] flex flex-col overflow-hidden">
      {/* Header */}
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

      {/* Body */}
      <div className="p-5 flex-1 overflow-y-auto space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-zinc-500 mb-1">Status</p>
            <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-800 text-zinc-300 capitalize">
              {position.status.replace('_', ' ')}
            </span>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 mb-1">Team / Dept</p>
            <p className="text-[13px] text-white font-medium">{position.team_name || position.department || '—'}</p>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            Occupants ({memberships.length}/{position.capacity})
          </p>
          {memberships.length === 0 ? (
            <div className="p-3 border border-dashed border-zinc-700 rounded-lg text-center">
              <p className="text-[12px] text-zinc-500">This position is currently empty.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {memberships.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                  {m.user?.avatar_url ? (
                    <img src={m.user.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
                      {m.user?.full_name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{m.user?.full_name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">Joined {new Date(m.joined_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Owner Actions Footer */}
      {isOwner && (
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 space-y-2">
          {!isOccupied && (
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
            <button 
              onClick={() => onLinkOpportunity(position)}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md bg-zinc-800 hover:bg-zinc-700 text-[12px] font-semibold text-zinc-300 transition-colors"
            >
              <LinkIcon size={12} /> {position.linked_opportunity_id ? 'Manage Link' : 'Link Role'}
            </button>
            <button 
              onClick={() => {
                if(confirm('Are you sure you want to remove this position from the team structure?')) {
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