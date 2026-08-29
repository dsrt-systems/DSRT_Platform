'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { UsersThree, ArrowSquareOut } from '@phosphor-icons/react'

interface Props {
  currentUserId: string
  membership: any
  teamMembers: any[]
}

export function Step3_YourTeam({ currentUserId, membership, teamMembers }: Props) {
  const currentPosition = membership.position

  // Find manager (parent position)
  const managerMembership = useMemo(() => {
    if (!currentPosition?.parent_position_id) return null
    return teamMembers.find(m => m.position_id === currentPosition.parent_position_id)
  }, [currentPosition, teamMembers])

  // Find teammates (same team_name or same parent)
  const teammates = useMemo(() => {
    return teamMembers.filter(m => {
      if (m.user_id === currentUserId) return false
      if (m.position_id === currentPosition?.parent_position_id) return false
      return m.position?.team_name === currentPosition?.team_name
    }).slice(0, 6)
  }, [teamMembers, currentPosition, currentUserId])

  const others = useMemo(() => {
    const excluded = new Set([
      currentUserId,
      managerMembership?.user_id,
      ...teammates.map(t => t.user_id)
    ])
    return teamMembers.filter(m => !excluded.has(m.user_id)).slice(0, 6)
  }, [teamMembers, currentUserId, managerMembership, teammates])

  return (
    <div className="space-y-6">

      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
          Team
        </p>
        <h2 className="text-[24px] font-bold text-white">Meet Your Team</h2>
        <p className="text-[13px] text-zinc-400 mt-1">
          These are the people you'll be working with.
        </p>
      </div>

      {/* Manager */}
      {managerMembership && (
        <div>
          <p className="text-[10.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
            You Report To
          </p>
          <PersonCard membership={managerMembership} />
        </div>
      )}

      {/* You (highlighted) */}
      <div>
        <p className="text-[10.5px] font-mono uppercase tracking-widest text-emerald-400 font-bold mb-2">
          You
        </p>
        <div className="bg-emerald-500/[0.03] border-2 border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0 border-2 border-emerald-500/30">
            {membership.user?.avatar_url ? (
              <img src={membership.user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              'Y'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white truncate">You</p>
            <p className="text-[11px] text-emerald-300 truncate mt-0.5">
              {membership.role_title || membership.position?.title || 'Team Member'}
            </p>
          </div>
        </div>
      </div>

      {/* Teammates */}
      {teammates.length > 0 && (
        <div>
          <p className="text-[10.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
            Your Team {currentPosition?.team_name && `(${currentPosition.team_name})`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {teammates.map(t => (
              <PersonCard key={t.id} membership={t} />
            ))}
          </div>
        </div>
      )}

      {/* Others */}
      {others.length > 0 && (
        <div>
          <p className="text-[10.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
            Also on the Venture
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {others.map(t => (
              <PersonCard key={t.id} membership={t} compact />
            ))}
          </div>
        </div>
      )}

      {teamMembers.length <= 1 && (
        <div className="bg-[#121215] border border-white/[0.06] rounded-2xl p-8 text-center">
          <UsersThree size={28} className="text-zinc-600 mx-auto mb-3" />
          <p className="text-[13px] font-bold text-white mb-1">You're one of the first</p>
          <p className="text-[11.5px] text-zinc-500 max-w-sm mx-auto">
            The team is just getting started. As more members join, they'll appear in the team graph.
          </p>
        </div>
      )}
    </div>
  )
}

function PersonCard({ membership, compact }: { membership: any; compact?: boolean }) {
  const user = membership.user
  const name = user?.full_name || 'Team Member'
  const role = membership.role_title || membership.position?.title

  return (
    <div className="bg-[#121215] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-bold text-white truncate">{name}</p>
        {role && !compact && (
          <p className="text-[10.5px] text-zinc-500 truncate">{role}</p>
        )}
      </div>
      {user?.username && (
        <Link
          href={`/profile/${user.username}`}
          target="_blank"
          className="text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowSquareOut size={12} />
        </Link>
      )}
    </div>
  )
}