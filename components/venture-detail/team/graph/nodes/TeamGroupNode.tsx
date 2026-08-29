'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { UsersThree, CaretDown } from '@phosphor-icons/react'
import type { NodeData } from '../types'

export const TeamGroupNode = memo(({ data, selected }: { data: NodeData; selected?: boolean }) => {
  const { position } = data
  const memberCount = position.occupied_count || 0
  const openCount = Math.max(0, (position.capacity || 0) - memberCount)

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-zinc-600 !border-2 !border-[#09090b]"
      />

      <div
        className={
          'w-[280px] rounded-xl overflow-hidden transition-all duration-200 ' +
          (selected
            ? 'ring-1 ring-white/30 shadow-2xl bg-[#121215]'
            : 'bg-[#0d0d10] border border-white/[0.06] shadow-md hover:border-white/[0.12]')
        }
      >
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-center flex-shrink-0">
            <UsersThree size={18} className="text-zinc-500" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white truncate">
              {position.title || 'Team'}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10.5px] font-semibold text-zinc-400">
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </span>
              {openCount > 0 && (
                <>
                  <span className="text-zinc-700 text-[10px]">·</span>
                  <span className="text-[10.5px] font-semibold text-zinc-300">
                    {openCount} open
                  </span>
                </>
              )}
            </div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 mt-1">
              Department
            </p>
          </div>

          <CaretDown size={12} className="text-zinc-700 flex-shrink-0" />
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-zinc-600 !border-2 !border-[#09090b]"
      />
    </>
  )
})

TeamGroupNode.displayName = 'TeamGroupNode'