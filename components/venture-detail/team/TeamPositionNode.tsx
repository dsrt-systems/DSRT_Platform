'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { User, Briefcase, Plus } from '@phosphor-icons/react'

export const TeamPositionNode = memo(({ data, selected }: any) => {
  const { position, occupants } = data
  const isOccupied = occupants && occupants.length > 0
  const isRecruiting = position.status === 'open' || position.status === 'recruiting'

  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-zinc-500 !border-0" />
      
      <div className={
        `w-[240px] rounded-xl overflow-hidden transition-all duration-200 ` +
        (selected ? 'ring-2 ring-white ' : 'ring-1 ring-white/10 ') +
        (isOccupied 
          ? 'bg-[#121215] shadow-lg' 
          : 'bg-[#09090b] border border-dashed border-zinc-700')
      }>
        
        {/* Header Strip */}
        <div className={`h-1.5 w-full ${isOccupied ? 'bg-zinc-700' : 'bg-zinc-800'}`} />

        <div className="p-4 flex flex-col items-center text-center">
          
          {/* Avatar / Placeholder */}
          <div className="relative mb-3">
            {isOccupied ? (
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#121215] bg-zinc-800 shadow-sm">
                {occupants[0].user?.avatar_url ? (
                  <img src={occupants[0].user.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-lg text-white">
                    {occupants[0].user?.full_name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full border border-dashed border-zinc-600 bg-zinc-900/50 flex items-center justify-center text-zinc-500">
                {isRecruiting ? <Briefcase size={20} /> : <User size={20} />}
              </div>
            )}
            
            {/* Multi-occupant indicator */}
            {occupants && occupants.length > 1 && (
              <div className="absolute -bottom-1 -right-1 bg-zinc-800 text-xs font-bold px-1.5 rounded-full border border-zinc-900">
                +{occupants.length - 1}
              </div>
            )}
          </div>

          {/* Details */}
          <h3 className={`text-[14px] font-bold truncate w-full ${isOccupied ? 'text-white' : 'text-zinc-300'}`}>
            {position.title}
          </h3>
          
          {isOccupied ? (
            <p className="text-[12px] text-zinc-400 truncate w-full mt-0.5">
              {occupants[0].user?.full_name || 'Member'}
            </p>
          ) : (
            <div className="mt-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-800/80 text-zinc-400">
                {position.status.replace('_', ' ')}
              </span>
            </div>
          )}

          {/* Linked Opportunity Indicator */}
          {position.linked_opportunity_id && (
            <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              <Briefcase size={10} weight="fill" /> Public Role
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-zinc-500 !border-0" />
    </>
  )
})
TeamPositionNode.displayName = 'TeamPositionNode'