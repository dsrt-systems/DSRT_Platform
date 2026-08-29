'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import Link from 'next/link'
import { Briefcase, ArrowRight, Users } from '@phosphor-icons/react'
import type { NodeData } from '../types'

export const OpenPositionNode = memo(({ data, selected }: { data: NodeData; selected?: boolean }) => {
  const { position } = data
  const capacity = position.capacity || 1
  const occupied = position.occupied_count || 0
  const remaining = Math.max(0, capacity - occupied)
  const isLinked = !!position.linked_opportunity_id
  const linkedSlug = position.linked_opportunity?.slug

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-zinc-700 !border-2 !border-[#09090b]"
      />

      <div
        className={
          'w-[260px] rounded-2xl overflow-hidden transition-all duration-200 ' +
          (selected
            ? 'ring-1 ring-white/30 shadow-2xl bg-[#09090b] border border-dashed border-white/20'
            : 'bg-transparent border border-dashed border-white/[0.15] hover:border-white/[0.25]')
        }
      >
        <div className="p-4">
          {/* Icon + Badge */}
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#121215] border border-white/[0.06] flex items-center justify-center text-zinc-500">
              <Briefcase size={16} weight="fill" />
            </div>

            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-zinc-300">
              Open Role
            </span>
          </div>

          {/* Title */}
          <p className="text-[13px] font-bold text-zinc-200 truncate">
            {position.title}
          </p>
          {position.team_name && (
            <p className="text-[10.5px] font-mono uppercase tracking-wider text-zinc-500 mt-0.5">
              {position.team_name}
            </p>
          )}

          {/* Capacity indicator */}
          <div className="mt-3 flex items-center gap-1.5 text-[10.5px] text-zinc-500">
            <Users size={11} />
            <span>
              <span className="font-bold text-zinc-300">{remaining}</span> of {capacity} open
            </span>
          </div>

          {/* Apply CTA if linked to opportunity */}
          {isLinked && linkedSlug ? (
            <Link
              href={`/looking-for/${linkedSlug}`}
              onClick={e => e.stopPropagation()}
              className="mt-4 inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-white text-black text-[10.5px] font-bold hover:bg-zinc-200 transition-colors group"
            >
              View Opening
              <ArrowRight size={10} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <p className="mt-4 text-[10px] text-zinc-600 italic">
              Unpublished
            </p>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-zinc-700 !border-2 !border-[#09090b]"
      />
    </>
  )
})

OpenPositionNode.displayName = 'OpenPositionNode'