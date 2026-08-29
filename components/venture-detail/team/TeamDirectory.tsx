'use client'

import { User } from '@phosphor-icons/react'
import Link from 'next/link'

interface Props {
  memberships: any[]
  positions: any[]
}

export function TeamDirectory({ memberships, positions }: Props) {
  if (memberships.length === 0) {
    return (
      <div className="bg-[#121215] border border-white/[0.06] rounded-2xl py-16 text-center">
        <User size={26} className="text-zinc-600 mx-auto mb-3" />
        <p className="text-[13px] text-zinc-400">No active members found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {memberships.map((m) => {
        const pos = positions.find(p => p.id === m.position_id)
        const name = m.user?.full_name || 'Member'
        
        return (
          <div key={m.id} className="bg-[#121215] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-4 transition-colors flex items-start gap-4">
            {m.user?.avatar_url ? (
              <img src={m.user.avatar_url} alt={name} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-zinc-800" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[16px] font-bold text-zinc-300">
                {name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-[14.5px] font-bold text-white truncate">{name}</h4>
                {pos?.position_type === 'founder' && (
                  <span className="text-[9px] font-bold text-zinc-300 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded uppercase">Founder</span>
                )}
              </div>
              <p className="text-[12.5px] text-zinc-400 mt-0.5">{pos?.title || m.role_title || 'Team Member'}</p>
              
              <div className="flex items-center gap-2 mt-3 text-[11px]">
                {m.user?.username && (
                  <Link href={`/profile/${m.user.username}`} className="font-semibold text-zinc-300 hover:text-white transition-colors">
                    View profile →
                  </Link>
                )}
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-500">Joined {new Date(m.joined_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}