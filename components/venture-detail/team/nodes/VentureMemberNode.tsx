'use client'

import { Handle, Position } from '@xyflow/react'
import { Crown } from '@phosphor-icons/react'

export function VentureMemberNode({ data }: { data: any }) {
  const m = data.member
  const u = m.users
  const name = u?.full_name || m.name
  const avatar = u?.avatar_url || m.avatar_url

  return (
    <div className={
      'bg-[#0f0f18] border rounded-xl px-3 py-2.5 min-w-[180px] shadow-xl ' +
      (data.isFounder ? 'border-purple-500/40' : 'border-white/[0.15]')
    }>
      <Handle type="target" position={Position.Top} className="!bg-purple-500 !border-0 !w-2 !h-2" />
      <div className="flex items-center gap-2.5">
        {avatar ? (
          <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0 text-[12px] font-bold text-purple-100">
            {name?.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-[12px] font-bold text-white truncate">{name}</p>
            {data.isFounder && <Crown size={10} weight="fill" className="text-yellow-400" />}
          </div>
          <p className="text-[10px] text-white/60 truncate">{m.role}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !border-0 !w-2 !h-2" />
    </div>
  )
}
