'use client'

import { useState, useMemo } from 'react'
import { CircleNotch, WarningCircle } from '@phosphor-icons/react'
import { OpenRolesHeader } from './OpenRolesHeader'
import { OpenRoleCard } from './OpenRoleCard'
import { OpenRoleEmptyState } from './OpenRoleEmptyState'
import { LinkPositionModal } from './LinkPositionModal'
import { useOpenRoles, type OpenRole } from './hooks/useOpenRoles'

interface Props {
  slug: string
  ventureId: string
  isOwner: boolean
  positions: any[]
}

type Filter = 'active' | 'drafts' | 'closed' | 'all'

export function OpenRolesSection({ slug, ventureId, isOwner, positions }: Props) {
  const { data, loading, error, reload } = useOpenRoles(slug, ventureId, isOwner)
  const [filter, setFilter] = useState<Filter>('active')
  const [linkModalRole, setLinkModalRole] = useState<OpenRole | null>(null)

  const filtered = useMemo(() => {
    const { roles } = data
    switch (filter) {
      case 'active':
        return roles.filter(r => ['active', 'closing-soon'].includes(r.status))
      case 'drafts':
        return roles.filter(r => r.status === 'draft')
      case 'closed':
        return roles.filter(r => ['closed', 'filled', 'archived', 'expired'].includes(r.status))
      case 'all':
        return roles
      default:
        return roles
    }
  }, [data, filter])

  // Enrich roles with linked_position from positions array
  const enriched = useMemo(() => {
    return filtered.map(r => ({
      ...r,
      linked_position: r.linked_position_id
        ? positions.find(p => p.id === r.linked_position_id)
        : null
    }))
  }, [filtered, positions])

  const filterOptions: Array<{ id: Filter; label: string; count: number }> = [
    { id: 'active', label: 'Active', count: data.totalActive },
    { id: 'drafts', label: 'Drafts', count: data.totalDrafts },
    { id: 'closed', label: 'Closed', count: data.totalClosed },
    { id: 'all', label: 'All', count: data.roles.length },
  ]

  return (
    <div className="space-y-5">

      <OpenRolesHeader
        slug={slug}
        isOwner={isOwner}
        totalActive={data.totalActive}
        totalApplications={data.totalApplications}
        totalNewApplications={data.totalNewApplications}
      />

      {/* Filter chips */}
      {data.roles.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterOptions.filter(f => isOwner || f.id === 'active' || f.id === 'all').map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={
                'inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-3 h-7 rounded-lg capitalize transition-colors ' +
                (filter === f.id
                  ? 'bg-white/[0.08] text-white border border-white/[0.15]'
                  : 'text-zinc-500 hover:text-white bg-[#0d0d10] border border-white/[0.04]')
              }
            >
              {f.label}
              {f.count > 0 && (
                <span className={filter === f.id ? 'text-zinc-400' : 'text-zinc-600'}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="h-40 rounded-2xl border border-white/[0.06] bg-[#121215]/50 flex items-center justify-center text-zinc-500 text-xs gap-2">
          <CircleNotch size={14} className="animate-spin" /> Loading open roles…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-6 text-center">
          <WarningCircle size={22} className="text-red-400 mx-auto mb-2" />
          <p className="text-[13px] font-bold text-white mb-1">Failed to load open roles</p>
          <p className="text-[11.5px] text-zinc-400 mb-3">{error}</p>
          <button
            onClick={reload}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-[12px] font-semibold"
          >
            Retry
          </button>
        </div>
      ) : data.roles.length === 0 ? (
        <OpenRoleEmptyState slug={slug} isOwner={isOwner} />
      ) : enriched.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d10] p-8 text-center">
          <p className="text-[12.5px] text-zinc-500">
            No {filter !== 'all' ? filter : ''} roles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enriched.map(role => (
            <OpenRoleCard
              key={role.id}
              role={role}
              positions={positions}
              slug={slug}
              isOwner={isOwner}
              onLinkClick={setLinkModalRole}
              onReload={reload}
            />
          ))}
        </div>
      )}

      {/* Link modal */}
      {linkModalRole && (
        <LinkPositionModal
          open={!!linkModalRole}
          onClose={() => setLinkModalRole(null)}
          slug={slug}
          opportunity={linkModalRole}
          positions={positions}
          onSuccess={reload}
        />
      )}
    </div>
  )
}