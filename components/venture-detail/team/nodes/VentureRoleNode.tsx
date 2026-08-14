'use client'

import { Handle, Position } from '@xyflow/react'
import { Briefcase } from '@phosphor-icons/react'

export function VentureRoleNode({ data }: { data: any }) {
  const r = data.role
  return (
    <div className="bg-[#0f0f18] border border-dashed border-orange-500/40 rounded-xl px-3 py-2.5 min-w-[180px] shadow-xl">
      <Handle type="target" position={Position.Top} className="!bg-orange-500 !border-0 !w-2 !h-2" />
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center flex-shrink-0">
          <Briefcase size={13} weight="fill" className="text-orange-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-white truncate">{r.title}</p>
          <p className="text-[10px] text-orange-300 uppercase tracking-wider font-bold">Open Role</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-orange-500 !border-0 !w-2 !h-2" />
    </div>
  )
}
