'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { User, Briefcase, Plus, Shield, Users } from '@phosphor-icons/react'
import Link from 'next/link'

export const TeamPositionNode = memo(({ data, selected }: any) => {
  const { position, occupants, isOwner } = data
  const isOccupied = occupants && occupants.length > 0
  const isRecruiting = position.status === 'open' || position.status === 'recruiting'
  const isGroup = position.position_type === 'team_group'

  // Standard occupied render
  if (isOccupied && !isGroup) {
    const primaryUser = occupants[0]?.user
    return (
      <>
        <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-zinc-700 !border-0" />
        <div className={
          `w-[240px] rounded-xl overflow-hidden transition-all duration-200 bg-[#121215] shadow-lg ` +
          (selected ? 'ring-2 ring-white' : 'ring-1 ring-white/10')
        }>
          <div className="h-1.5 w-full bg-zinc-700" />
          <div className="p-4 flex flex-col items-center text-center">
            <div className="relative mb-3">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-900 shadow-sm flex items-center justify-center">
                {primaryUser?.avatar_url ? (
                  <img src={primaryUser.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="font-bold text-lg text-white">
                    {primaryUser?.full_name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-[13.5px] font-bold text-white truncate w-full">{position.title}</h3>
            {primaryUser?.username ? (
              <Link
                href={`/profile/${primaryUser.username}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11.5px] text-zinc-400 hover:text-white truncate w-full mt-0.5 hover:underline"
              >
                {primaryUser.full_name || 'Member'}
              </Link>
            ) : (
              <p className="text-[11.5px] text-zinc-400 truncate w-full mt-0.5">Anonymous Member</p>
            )}

            {/* Render Required Skills inside rich node card */}
            {position.required_skills && position.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center mt-3">
                {position.required_skills.slice(0, 2).map((skill: string, idx: number) => (
                  <span key={idx} className="text-[9.5px] px-1.5 py-0.5 bg-zinc-800 rounded font-mono text-zinc-400 capitalize">
                    {skill}
                  </span>
                ))}
                {position.required_skills.length > 2 && (
                  <span className="text-[9.5px] px-1.5 py-0.5 bg-zinc-800 rounded font-mono text-zinc-400">
                    +{position.required_skills.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-zinc-700 !border-0" />
      </>
    )
  }

  // Visual grouping department team card Node styling
  if (isGroup) {
    return (
      <>
        <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-zinc-700 !border-0" />
        <div className={
          `w-[240px] rounded-xl overflow-hidden transition-all duration-200 bg-[#0d0d10] border-2 border-white/[0.04] p-4 flex items-center gap-3 ` +
          (selected ? 'ring-2 ring-white' : '')
        }>
          <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[12.5px] font-bold text-white truncate">{position.title || 'Department Group'}</h3>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wide">Structural Unit</p>
          </div>
        </div>
        <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-zinc-700 !border-0" />
      </>
    )
  }

  // Open Recruiting position Node design
  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-zinc-700 !border-0" />
      <div className={
        `w-[240px] rounded-xl overflow-hidden transition-all duration-200 bg-transparent border border-dashed border-zinc-700 ` +
        (selected ? 'ring-2 ring-white' : '')
      }>
        <div className="p-4 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full border border-dashed border-zinc-600 bg-zinc-900/50 flex items-center justify-center text-zinc-500 mb-3">
            <Briefcase size={20} />
          </div>

          <h3 className="text-[13px] font-bold text-zinc-300 truncate w-full">{position.title}</h3>
          
          <div className="mt-2.5">
            {position.linked_opportunity_id ? (
              <Link
                href={`/looking-for/${position.linked_opportunity?.slug || position.linked_opportunity_id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-2 py-0.5 rounded-full hover:underline font-semibold"
              >
                <Briefcase size={10} weight="fill" /> Apply Now
              </Link>
            ) : (
              <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-zinc-800 text-zinc-500 font-bold">
                Open Role
              </span>
            )}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-zinc-700 !border-0" />
    </>
  )
})

TeamPositionNode.displayName = 'TeamPositionNode'