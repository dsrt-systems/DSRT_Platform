'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import Link from 'next/link'
import { ArrowSquareOut, CheckCircle } from '@phosphor-icons/react'
import type { NodeData } from '../types'

export const PersonNode = memo(({ data, selected }: { data: NodeData; selected?: boolean }) => {
  const { position, occupants } = data
  const primary = occupants[0]?.user
  const additionalCount = occupants.length - 1

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-zinc-600 !border-2 !border-[#09090b]"
      />

      <div
        className={
          'w-[260px] rounded-2xl overflow-hidden transition-all duration-200 ' +
          (selected
            ? 'ring-1 ring-white/30 shadow-2xl bg-[#121215]'
            : 'ring-1 ring-white/[0.06] bg-[#121215] shadow-lg hover:ring-white/[0.12]')
        }
      >
        <div className="p-4">
          {/* Avatar + Name */}
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-[#09090b] flex items-center justify-center border border-white/[0.06] shadow-sm flex-shrink-0">
              {primary?.avatar_url ? (
                <img src={primary.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[14px] font-bold text-zinc-400">
                  {(primary?.full_name || 'M').charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-[13px] font-bold text-white truncate">
                  {primary?.full_name || 'Team Member'}
                </p>
                {occupants[0]?.status === 'active' && (
                  <CheckCircle size={11} weight="fill" className="text-zinc-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                {position.title}
              </p>
              {position.team_name && (
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mt-1">
                  {position.team_name}
                </p>
              )}
            </div>

            {additionalCount > 0 && (
              <div className="text-[10px] font-bold text-zinc-400 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded-full flex-shrink-0">
                +{additionalCount}
              </div>
            )}
          </div>

          {/* Responsibilities preview */}
          {Array.isArray(position.responsibilities) && position.responsibilities.length > 0 && (
            <div className="mt-3 space-y-0.5">
              {position.responsibilities.slice(0, 2).map((resp: string, i: number) => (
                <p key={i} className="text-[10.5px] text-zinc-500 truncate leading-relaxed">
                  · {resp}
                </p>
              ))}
              {position.responsibilities.length > 2 && (
                <p className="text-[10px] text-zinc-600 italic">
                  +{position.responsibilities.length - 2} more
                </p>
              )}
            </div>
          )}

          {/* Skills */}
          {Array.isArray(position.required_skills) && position.required_skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {position.required_skills.slice(0, 3).map((skill: string, i: number) => (
                <span
                  key={i}
                  className="text-[9.5px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wide bg-white/[0.02] border border-white/[0.04] text-zinc-400"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Profile link */}
          {primary?.username && (
            <Link
              href={`/profile/${primary.username}`}
              onClick={e => e.stopPropagation()}
              className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-semibold text-zinc-500 hover:text-white transition-colors group"
            >
              View profile
              <ArrowSquareOut size={9} className="opacity-60 group-hover:opacity-100" />
            </Link>
          )}
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

PersonNode.displayName = 'PersonNode'