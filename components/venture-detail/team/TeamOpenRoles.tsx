'use client'

import { Briefcase, Link as LinkIcon, ArrowRight } from '@phosphor-icons/react'
import Link from 'next/link'

interface Props {
  positions: any[]
  isOwner: boolean
}

export function TeamOpenRoles({ positions, isOwner }: Props) {
  // Filter for positions that are explicitly marked open/recruiting OR have remaining capacity
  const openPositions = positions.filter(p => 
    p.status === 'open' || 
    p.status === 'recruiting' || 
    (p.status === 'occupied' && p.occupied_count < p.capacity)
  )

  if (openPositions.length === 0) {
    return (
      <div className="bg-[#121215] border border-white/[0.06] rounded-2xl py-16 text-center">
        <Briefcase size={26} className="text-zinc-600 mx-auto mb-3" />
        <p className="text-[13px] text-zinc-400">No open positions in the organizational structure.</p>
        {isOwner && <p className="text-[12px] text-zinc-500 mt-1">Add positions in the Graph view to start recruiting.</p>}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {openPositions.map(pos => {
        const remainingCapacity = pos.capacity - pos.occupied_count

        return (
          <div key={pos.id} className="bg-[#121215] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-[15px] font-bold text-white leading-tight">{pos.title}</h4>
                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300">
                  {pos.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500 mb-3">
                {pos.department && <span>{pos.department}</span>}
                {pos.position_type && <span className="capitalize">{pos.position_type.replace('_', ' ')}</span>}
                <span>{remainingCapacity} opening{remainingCapacity !== 1 ? 's' : ''}</span>
              </div>

              {pos.description && (
                <p className="text-[12px] text-zinc-400 line-clamp-3 mb-4">{pos.description}</p>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              {pos.linked_opportunity_id ? (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                  <LinkIcon size={12} weight="bold" /> Linked to Public Role
                </div>
              ) : (
                <span className="text-[11px] text-zinc-500 italic">Not publicly visible</span>
              )}

              {pos.linked_opportunity_id ? (
                <Link 
                  href={`/looking-for/${pos.linked_opportunity?.slug || pos.linked_opportunity_id}`}
                  className="flex items-center gap-1 text-[12px] font-semibold text-white hover:text-zinc-300 transition-colors"
                >
                  View Role <ArrowRight size={12} weight="bold" />
                </Link>
              ) : isOwner ? (
                <span className="text-[11px] text-zinc-500">Link via Graph inspector</span>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}