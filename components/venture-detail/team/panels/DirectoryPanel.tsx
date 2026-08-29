'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { MagnifyingGlass, Users, Circle } from '@phosphor-icons/react'
import { MemberActionMenu } from '../member-actions/MemberActionMenu'
import { ChangeRoleModal } from '../member-actions/ChangeRoleModal'
import { SuspendMemberModal } from '../member-actions/SuspendMemberModal'
import { RemoveMemberModal } from '../member-actions/RemoveMemberModal'
import { toast } from 'sonner'

interface Props {
  slug: string
  memberships: any[]
  positions: any[]
  isOwner: boolean
  currentUserId: string | null
  onRefresh: () => void
}

type Filter = 'active' | 'pending' | 'suspended' | 'former' | 'all'

export function DirectoryPanel({ slug, memberships, positions, isOwner, currentUserId, onRefresh }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('active')

  const [roleModalMember, setRoleModalMember] = useState<any | null>(null)
  const [suspendModalMember, setSuspendModalMember] = useState<any | null>(null)
  const [removeModalMember, setRemoveModalMember] = useState<any | null>(null)
  const [leaveModal, setLeaveModal] = useState<any | null>(null)

  const counts = useMemo(() => ({
    active: memberships.filter(m => m.status === 'active').length,
    pending: memberships.filter(m => m.status === 'invited' || m.status === 'pending').length,
    suspended: memberships.filter(m => m.status === 'suspended').length,
    former: memberships.filter(m => m.status === 'removed').length,
    all: memberships.length,
  }), [memberships])

  const filtered = useMemo(() => {
    return memberships.filter(m => {
      if (filter === 'active' && m.status !== 'active') return false
      if (filter === 'pending' && !['invited', 'pending'].includes(m.status)) return false
      if (filter === 'suspended' && m.status !== 'suspended') return false
      if (filter === 'former' && m.status !== 'removed') return false

      if (query) {
        const q = query.toLowerCase()
        const name = (m.user?.full_name || '').toLowerCase()
        const username = (m.user?.username || '').toLowerCase()
        const role = (m.role_title || '').toLowerCase()
        if (!name.includes(q) && !username.includes(q) && !role.includes(q)) return false
      }

      return true
    })
  }, [memberships, filter, query])

  const handleRestore = async (membership: any) => {
    try {
      const res = await fetch(`/api/ventures/${slug}/team/memberships/${membership.id}/restore`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error()
      toast.success('Access restored')
      onRefresh()
    } catch {
      toast.error('Could not restore access')
    }
  }

  if (memberships.length === 0) {
    return (
      <div className="bg-[#121215] border border-white/[0.06] rounded-2xl p-16 text-center">
        <Users size={32} className="text-zinc-600 mx-auto mb-3" />
        <h3 className="text-[14px] font-bold text-white mb-1">No team members yet</h3>
        <p className="text-[12.5px] text-zinc-500 max-w-sm mx-auto">
          Start building your team by adding positions and inviting members through the Graph.
        </p>
      </div>
    )
  }

  const filterOptions: { id: Filter; label: string }[] = [
    { id: 'active', label: 'Active' },
    { id: 'pending', label: 'Pending' },
    { id: 'suspended', label: 'Suspended' },
    { id: 'former', label: 'Former' },
    { id: 'all', label: 'All' },
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, username, or role..."
            className="w-full h-9 pl-9 pr-3 bg-[#0d0d10] border border-white/[0.06] rounded-lg text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15]"
            aria-label="Search team members"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#0d0d10] border border-white/[0.06] rounded-lg p-1 overflow-x-auto">
          {filterOptions.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={
                'flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 h-7 rounded whitespace-nowrap transition-colors ' +
                (filter === f.id
                  ? 'bg-white/[0.08] text-white'
                  : 'text-zinc-500 hover:text-white')
              }
            >
              {f.label}
              {counts[f.id] > 0 && (
                <span className={filter === f.id ? 'text-zinc-400' : 'text-zinc-600'}>
                  {counts[f.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-[#121215] border border-white/[0.06] rounded-2xl p-8 text-center">
          <p className="text-[12.5px] text-zinc-500">
            No members match your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(m => {
            const pos = positions.find(p => p.id === m.position_id)
            const name = m.user?.full_name || 'Team Member'
            const isSelf = m.user_id === currentUserId

            return (
              <div
                key={m.id}
                className="bg-[#121215] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-4 transition-all flex items-start gap-3"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-[15px] font-bold text-white flex-shrink-0">
                  {m.user?.avatar_url ? (
                    <img src={m.user.avatar_url} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h4 className="text-[14px] font-bold text-white truncate">{name}</h4>
                      {isSelf && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
                          You
                        </span>
                      )}
                      <StatusPill status={m.status} />
                    </div>

                    <MemberActionMenu
                      membership={m}
                      isOwner={isOwner}
                      isSelf={isSelf}
                      onChangeRole={() => setRoleModalMember(m)}
                      onSuspend={() => setSuspendModalMember(m)}
                      onRestore={() => handleRestore(m)}
                      onRemove={() => setRemoveModalMember(m)}
                      onLeave={() => setLeaveModal(m)}
                    />
                  </div>

                  <p className="text-[12px] text-zinc-400 mt-0.5 truncate">
                    {m.role_title || pos?.title || 'Member'}
                    {pos?.team_name && <span className="text-zinc-600"> · {pos.team_name}</span>}
                  </p>

                  <div className="flex items-center gap-3 mt-2.5 text-[11px]">
                    {m.user?.username && (
                      <Link
                        href={`/profile/${m.user.username}`}
                        className="text-zinc-300 hover:text-white font-semibold"
                      >
                        @{m.user.username}
                      </Link>
                    )}
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-500">
                      Joined {formatDate(m.activated_at || m.joined_at || m.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Action Modals */}
      {roleModalMember && (
        <ChangeRoleModal
          open={!!roleModalMember}
          onClose={() => setRoleModalMember(null)}
          slug={slug}
          membership={roleModalMember}
          onSuccess={onRefresh}
        />
      )}
      {suspendModalMember && (
        <SuspendMemberModal
          open={!!suspendModalMember}
          onClose={() => setSuspendModalMember(null)}
          slug={slug}
          membership={suspendModalMember}
          onSuccess={onRefresh}
        />
      )}
      {removeModalMember && (
        <RemoveMemberModal
          open={!!removeModalMember}
          onClose={() => setRemoveModalMember(null)}
          slug={slug}
          membership={removeModalMember}
          isSelfLeave={false}
          onSuccess={onRefresh}
        />
      )}
      {leaveModal && (
        <RemoveMemberModal
          open={!!leaveModal}
          onClose={() => setLeaveModal(null)}
          slug={slug}
          membership={leaveModal}
          isSelfLeave={true}
          onSuccess={onRefresh}
        />
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; dot: string }> = {
    active: { label: 'Active', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
    invited: { label: 'Invited', color: 'text-blue-300 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
    pending: { label: 'Pending', color: 'text-blue-300 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
    suspended: { label: 'Suspended', color: 'text-amber-300 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
    removed: { label: 'Removed', color: 'text-zinc-500 bg-zinc-800 border-zinc-700', dot: 'bg-zinc-500' },
  }
  const c = config[status] || config.active
  return (
    <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${c.color}`}>
      <Circle size={5} weight="fill" className={c.dot} />
      {c.label}
    </span>
  )
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}