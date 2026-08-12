'use client'

import { useEffect, useState, useCallback } from 'react'
import { Users, Briefcase, Sparkle, Plus, Clock, MapPin, ArrowRight } from '@phosphor-icons/react'
import { TeamGraph } from './TeamGraph'
import { RoleCreateModal } from '../applicants/RoleCreateModal'
import { RoleDetailModal } from '../applicants/RoleDetailModal'

interface Props {
  slug: string
  projectId: string
  isOwner: boolean
  currentUserId: string | null
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  'full-time': 'Full-time', 'part-time': 'Part-time', contract: 'Contract',
  internship: 'Internship', volunteer: 'Volunteer',
}
const LOCATION_LABELS: Record<string, string> = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' }

export function TeamStructureTab({ slug, projectId, isOwner, currentUserId }: Props) {
  const [view, setView] = useState<'graph'|'members'|'roles'>('graph')
  const [roles, setRoles] = useState<any[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editRole, setEditRole] = useState<any>(null)
  const [detailRole, setDetailRole] = useState<any>(null)

  const fetchRoles = useCallback(async () => {
    setRolesLoading(true)
    try {
      const res = await fetch('/api/projects/' + slug + '/roles')
      const json = await res.json()
      setRoles(json.roles || [])
    } finally { setRolesLoading(false) }
  }, [slug])

  useEffect(() => { fetchRoles() }, [fetchRoles])

  const openRoles = roles.filter((r: any) => r.status === 'open')

  const openCreate = () => { setEditRole(null); setCreateOpen(true) }
  const openEdit = (role: any) => { setDetailRole(null); setEditRole(role); setCreateOpen(true) }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-white">Team Structure</h2>
          <p className="text-[13px] text-white/55 mt-0.5">How the team is organized and what roles are open</p>
        </div>
        <div className="flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5">
          {[
            { id: 'graph', label: 'Graph', icon: Sparkle },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'roles', label: 'Open Roles', icon: Briefcase },
          ].map(v => {
            const Icon = v.icon
            const active = view === v.id
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id as any)}
                className={
                  'flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold rounded-md transition-colors ' +
                  (active ? 'bg-white/[0.08] text-white' : 'text-white/50 hover:text-white/85')
                }
              >
                <Icon size={12} weight={active ? 'fill' : 'regular'} />
                {v.label}
              </button>
            )
          })}
        </div>
      </div>

      {view === 'graph' && (
        <>
          <TeamGraph slug={slug} isOwner={isOwner} />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[17px] font-bold text-white flex items-center gap-2">
                  Open Roles <span className="text-white/40 font-normal text-[14px]">({openRoles.length})</span>
                </h3>
                <p className="text-[12px] text-white/50 mt-0.5">Join us and build the future.</p>
              </div>
              {isOwner && (
                <button
                  onClick={openCreate}
                  className="flex items-center gap-1.5 text-[12px] font-semibold bg-white text-black hover:bg-white/90 px-3 h-8 rounded-md"
                >
                  <Plus size={11} weight="bold" /> Post role
                </button>
              )}
            </div>

            {rolesLoading ? (
              <div className="text-[13px] text-white/40 py-6 text-center">Loading...</div>
            ) : openRoles.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-10 text-center">
                <Briefcase size={28} className="mx-auto mb-2 text-white/25" />
                <p className="text-[14px] text-white/50">No open roles right now</p>
                {isOwner && (
                  <button
                    onClick={openCreate}
                    className="text-[13px] font-medium text-white/85 hover:text-white underline underline-offset-2 mt-2"
                  >
                    + Post an open role
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {openRoles.slice(0, 6).map((role: any) => (
                  <RoleCard key={role.id} role={role} slug={slug} onClick={() => setDetailRole(role)} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {view === 'roles' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-bold text-white">All Open Roles</h3>
            {isOwner && (
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 text-[13px] font-semibold bg-white text-black hover:bg-white/90 px-3.5 h-8 rounded-md"
              >
                <Plus size={12} weight="bold" /> Post new role
              </button>
            )}
          </div>
          {rolesLoading ? (
            <div className="text-[13px] text-white/40 py-6 text-center">Loading...</div>
          ) : openRoles.length === 0 ? (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-12 text-center">
              <Briefcase size={30} className="mx-auto mb-2 text-white/25" />
              <p className="text-[14px] text-white/45">No open roles yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {openRoles.map((role: any) => (
                <RoleCard key={role.id} role={role} slug={slug} onClick={() => setDetailRole(role)} />
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'members' && (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-10 text-center">
          <Users size={30} className="mx-auto mb-2 text-white/25" />
          <p className="text-[14px] text-white/45">Members list view — use graph view or team sidebar for now</p>
        </div>
      )}

      {createOpen && (
        <RoleCreateModal
          slug={slug}
          role={editRole}
          onClose={() => { setCreateOpen(false); setEditRole(null) }}
          onSaved={fetchRoles}
        />
      )}

      {detailRole && (
        <RoleDetailModal
          slug={slug}
          role={detailRole}
          isOwner={isOwner}
          currentUserId={currentUserId}
          onClose={() => setDetailRole(null)}
          onEdit={openEdit}
          onDeleted={fetchRoles}
          onApplied={fetchRoles}
        />
      )}
    </div>
  )
}

function RoleCard({ role, slug, onClick }: { role: any; slug: string; onClick: () => void }) {
  const skills = role.key_skills || role.skills_needed || []
  return (
    <button
      onClick={onClick}
      className="bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.05] rounded-xl p-4 transition-colors flex flex-col text-left"
    >
      <div className="flex items-start gap-3 mb-2.5">
        <div className="w-10 h-10 rounded-lg bg-orange-500/12 border border-orange-500/25 flex items-center justify-center flex-shrink-0">
          <Briefcase size={16} weight="fill" className="text-orange-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[15px] font-bold text-white leading-tight">{role.title}</h4>
          <p className="text-[11px] font-semibold text-orange-300 uppercase tracking-wider mt-0.5">Open Role</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-2.5">
        {role.location_type && (
          <span className="text-[10px] font-semibold text-white/70 bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded flex items-center gap-1">
            <MapPin size={9} /> {LOCATION_LABELS[role.location_type] || role.location_type}
          </span>
        )}
        {role.employment_type && (
          <span className="text-[10px] font-semibold text-white/70 bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded flex items-center gap-1">
            <Clock size={9} /> {EMPLOYMENT_LABELS[role.employment_type] || role.employment_type}
          </span>
        )}
      </div>

      {role.description && (
        <p className="text-[12px] text-white/65 leading-snug line-clamp-2 mb-3">{role.description}</p>
      )}

      {skills.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-semibold text-white/45 uppercase tracking-wider mb-1">Key Skills</p>
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 4).map((s: string) => (
              <span key={s} className="text-[10px] font-semibold text-white/75 bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/[0.05]">
        <span className="text-[11px] text-white/50">
          {role.applicants || 0} applicant{role.applicants !== 1 ? 's' : ''}
        </span>
        <span className="text-[11px] font-semibold text-white/85 flex items-center gap-1">
          View Details <ArrowRight size={10} />
        </span>
      </div>
    </button>
  )
}
