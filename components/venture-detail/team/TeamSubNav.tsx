'use client'

import {
  GridFour, Users, ListBullets, PaperPlaneTilt, UserPlus,
  ShieldCheck, Briefcase, ClockCounterClockwise
} from '@phosphor-icons/react'

interface TeamStats {
  activeMembers: number
  pendingInvitations: number
  pendingRequests: number
  openPositions: number
  linkedOpportunities: number
}

export type TeamSection =
  | 'graph' | 'directory' | 'structure'
  | 'invitations' | 'requests' | 'roles'
  | 'open-roles' | 'activity'

interface Props {
  activeSection: TeamSection
  onSelect: (section: TeamSection) => void
  stats: TeamStats
  isOwner: boolean
}

export function TeamSubNav({ activeSection, onSelect, stats, isOwner }: Props) {
  const items: Array<{
    id: TeamSection
    label: string
    icon: any
    badge?: number
    ownerOnly?: boolean
  }> = [
    { id: 'graph', label: 'Graph', icon: GridFour },
    { id: 'directory', label: 'Directory', icon: Users, badge: stats.activeMembers },
    { id: 'structure', label: 'Structure', icon: ListBullets },
    { id: 'invitations', label: 'Invitations', icon: PaperPlaneTilt, badge: stats.pendingInvitations, ownerOnly: true },
    { id: 'requests', label: 'Requests', icon: UserPlus, badge: stats.pendingRequests, ownerOnly: true },
    { id: 'roles', label: 'Roles', icon: ShieldCheck, ownerOnly: true },
    { id: 'open-roles', label: 'Open Roles', icon: Briefcase, badge: stats.linkedOpportunities },
    { id: 'activity', label: 'Activity', icon: ClockCounterClockwise, ownerOnly: true },
  ]

  const visibleItems = items.filter(item => !item.ownerOnly || isOwner)

  return (
    <div className="flex items-center gap-0.5 bg-[#0d0d10] border border-white/[0.06] rounded-xl p-1 overflow-x-auto scrollbar-hide">
      {visibleItems.map(item => {
        const Icon = item.icon
        const active = activeSection === item.id
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={
              'flex items-center gap-1.5 text-[12px] font-semibold px-3 h-8 rounded-lg whitespace-nowrap transition-all ' +
              (active
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]')
            }
          >
            <Icon size={13} weight={active ? 'fill' : 'regular'} />
            {item.label}
            {item.badge !== undefined && item.badge > 0 && (
              <span className={
                'ml-0.5 text-[10px] font-bold px-1.5 h-4 rounded-full flex items-center justify-center min-w-[16px] ' +
                (active ? 'bg-black/10 text-black' : 'bg-white/10 text-white/70')
              }>
                {item.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}