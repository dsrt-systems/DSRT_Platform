'use client'

import { useState } from 'react'
import { User, Shield, DotsThree } from '@phosphor-icons/react'
import Link from 'next/link'

interface Props {
  memberships: any[]
  positions: any[]
}

export function TeamDirectory({ memberships, positions }: Props) {
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended'>('all')

  const filteredMembers = memberships.filter(m => {
    if (filter === 'active') return m.status === 'active'
    if (filter === 'suspended') return m.status === 'suspended'
    return true
  })

  if (memberships.length === 0) {
    return (
      <div className="bg-[#121215] border border-white/[0.06] rounded-2xl py-16 text-center">
        <User size={26} className="text-zinc-600 mx-auto mb-3" />
        <p className="text-[13px] text-zinc-400">No active team members registered.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(['all', 'active', 'suspended'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[11.5px] font-semibold px-3 py-1 rounded-lg capitalize transition-colors ${filter === f ? 'bg-white text-black font-bold' : 'bg-[#121215] border border-white/[0.06] text-zinc-400 hover:text-white'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMembers.map((m) => {
          const pos = positions.find(p => p.id === m.position_id)
          const name = m.user?.full_name || 'Member'
          const isFounder = pos?.position_type === 'founder'
          
          return (
            <div key={m.id} className="bg-[#121215] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-4 transition-all flex items-start gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-800 font-bold text-white text-base">
                {m.user?.avatar_url ? (
                  <img src={m.user.avatar_url} alt={name} className="w-full h-full object-cover" />
                ) : (
                  name.charAt(0)
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h4 className="text-[14.5px] font-bold text-white truncate">{name}</h4>
                    {isFounder && (
                      <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase">Founder</span>
                    )}
                  </div>
                  <span className={`w-2 h-2 rounded-full ${m.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                </div>

                <p className="text-[12.5px] text-zinc-400 mt-0.5">{pos?.title || m.role_title || 'Team Member'}</p>
                
                <div className="flex items-center gap-3 mt-3 text-[11px] text-zinc-500">
                  {m.user?.username && (
                    <Link href={`/profile/${m.user.username}`} className="font-semibold text-zinc-300 hover:text-white transition-colors">
                      View profile →
                    </Link>
                  )}
                  <span>·</span>
                  <span>Joined {new Date(m.joined_at || m.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}