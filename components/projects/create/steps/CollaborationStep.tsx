'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Users, MapPin, Clock, Briefcase, MagnifyingGlass, CheckCircle } from '@phosphor-icons/react'
import { useProjectCreationStore } from '@/stores/projectCreationStore'

interface DSRTUser {
  id: string
  username: string
  full_name: string
  avatar_url?: string | null
  tagline?: string | null
}

interface RoleDraft {
  id: string
  title: string
  description?: string
  commitment: string
  work_mode: string
}

export function CollaborationStep() {
  const { data, updateData } = useProjectCreationStore()

  // Collaborator search state
  const [userQuery, setUserQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DSRTUser[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)

  // Role draft state
  const [roleFormOpen, setRoleFormOpen] = useState(false)
  const [roleTitle, setRoleTitle] = useState('')
  const [roleDesc, setRoleDesc] = useState('')
  const [roleCommitment, setRoleCommitment] = useState('part-time')
  const [roleMode, setRoleMode] = useState('remote')

  const roles: RoleDraft[] = data.looking_for_roles || []
  const collaborators: DSRTUser[] = data.collaborators || []

  // Search DSRT users via /api/users/search?q=
  useEffect(() => {
    if (userQuery.trim().length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingUsers(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(userQuery)}`)
        const json = await res.json()
        setSearchResults(json.users || [])
      } catch (e) {
        console.error(e)
      } finally {
        setIsSearchingUsers(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [userQuery])

  const addCollaborator = (u: DSRTUser) => {
    if (collaborators.some(c => c.id === u.id)) return
    updateData({ collaborators: [...collaborators, u] })
    setUserQuery('')
    setSearchResults([])
  }

  const removeCollaborator = (id: string) => {
    updateData({ collaborators: collaborators.filter(c => c.id !== id) })
  }

  const handleAddRole = () => {
    if (!roleTitle.trim()) return
    const newRole: RoleDraft = {
      id: Math.random().toString(36).substring(2, 9),
      title: roleTitle.trim(),
      description: roleDesc.trim() || undefined,
      commitment: roleCommitment,
      work_mode: roleMode,
    }

    updateData({ looking_for_roles: [...roles, newRole] })
    setRoleTitle('')
    setRoleDesc('')
    setRoleFormOpen(false)
  }

  const removeRole = (id: string) => {
    updateData({ looking_for_roles: roles.filter(r => r.id !== id) })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Collaboration Status */}
      <div className="space-y-4">
        <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider block mb-1">
          Collaboration Status
        </label>

        <div className="space-y-2">
          {[
            { id: 'solo', label: 'Building solo', desc: "I'm working on this alone for now." },
            { id: 'has_collaborators', label: 'Already have a team', desc: 'Invite existing collaborators to this project.' },
            { id: 'open_to_contributors', label: 'Open to contributors', desc: 'Anyone on DSRT can request to contribute.' },
            { id: 'looking_for_collaborators', label: 'Actively looking for collaborators', desc: 'I need specific roles to build this.' },
          ].map(opt => {
            const active = data.collaboration_status === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => updateData({ collaboration_status: opt.id as any })}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  active
                    ? 'bg-white/[0.06] border-white/[0.25] shadow-sm'
                    : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04]'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? 'border-white bg-white' : 'border-white/20'}`}>
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
                <div>
                  <p className={`text-[14px] font-bold ${active ? 'text-white' : 'text-zinc-300'}`}>{opt.label}</p>
                  <p className="text-[12px] text-zinc-500 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Invite Collaborators Search */}
      {(data.collaboration_status === 'has_collaborators' || data.collaboration_status === 'open_to_contributors') && (
        <div className="pt-6 border-t border-white/[0.06] space-y-4">
          <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider block">
            Invite DSRT Collaborators
          </label>

          {collaborators.length > 0 && (
            <div className="space-y-2 mb-3">
              {collaborators.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-[#09090b] border border-white/[0.08] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-white text-xs">
                      {c.full_name?.[0]}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-white">{c.full_name}</p>
                      <p className="text-[11px] text-zinc-500">@{c.username}</p>
                    </div>
                  </div>
                  <button onClick={() => removeCollaborator(c.id)} className="text-zinc-500 hover:text-white p-1">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={userQuery}
              onChange={e => setUserQuery(e.target.value)}
              placeholder="Search DSRT members by name or @username..."
              className="w-full h-11 pl-11 pr-4 bg-[#09090b] border border-white/[0.1] rounded-xl text-[13.5px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
            />

            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#121215] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden z-20 max-h-[220px] overflow-y-auto divide-y divide-white/[0.04]">
                {searchResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => addCollaborator(u)}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/[0.04] text-left transition-colors"
                  >
                    <div>
                      <p className="text-[13px] font-bold text-white">{u.full_name}</p>
                      <p className="text-[11px] text-zinc-500">@{u.username}</p>
                    </div>
                    <Plus size={14} className="text-zinc-500" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Open Roles Drafts */}
      {data.collaboration_status === 'looking_for_collaborators' && (
        <div className="pt-6 border-t border-white/[0.06] space-y-4">
          <div>
            <h3 className="text-[15px] font-bold text-white flex items-center gap-2">
              <Briefcase size={16} weight="fill" className="text-purple-400" />
              Open Roles for Looking For
            </h3>
            <p className="text-[12.5px] text-zinc-500 mt-1">
              Roles added here will publish directly to DSRT Looking For when you launch.
            </p>
          </div>

          {roles.length > 0 && (
            <div className="space-y-2">
              {roles.map(role => (
                <div key={role.id} className="p-4 bg-[#09090b] border border-white/[0.1] rounded-xl flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-[14px] font-bold text-white mb-1">{role.title}</h4>
                    {role.description && <p className="text-[12px] text-zinc-400 line-clamp-1 mb-2">{role.description}</p>}
                    <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Clock size={12} /> {role.commitment}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} /> {role.work_mode}</span>
                    </div>
                  </div>
                  <button onClick={() => removeRole(role.id)} className="w-7 h-7 rounded-md bg-white/[0.04] hover:bg-red-500/20 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {!roleFormOpen ? (
            <button
              onClick={() => setRoleFormOpen(true)}
              className="w-full h-11 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.15] bg-white/[0.02] hover:bg-white/[0.04] text-[13px] font-semibold text-white transition-all"
            >
              <Plus size={14} weight="bold" /> Add a role
            </button>
          ) : (
            <div className="p-5 bg-white/[0.03] border border-white/[0.1] rounded-xl space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold mb-1.5">Role Title *</label>
                <input
                  autoFocus
                  value={roleTitle}
                  onChange={e => setRoleTitle(e.target.value)}
                  placeholder="e.g. Embedded Systems Engineer"
                  className="w-full h-10 px-3 bg-[#09090b] border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold mb-1.5">Commitment</label>
                  <select
                    value={roleCommitment}
                    onChange={e => setRoleCommitment(e.target.value)}
                    className="w-full h-10 px-3 bg-[#09090b] border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none focus:border-zinc-500"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="contributor">Contributor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold mb-1.5">Work Mode</label>
                  <select
                    value={roleMode}
                    onChange={e => setRoleMode(e.target.value)}
                    className="w-full h-10 px-3 bg-[#09090b] border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none focus:border-zinc-500"
                  >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="on-site">On-site</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setRoleFormOpen(false)} className="px-4 h-8 text-[12px] font-semibold text-zinc-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={handleAddRole} disabled={!roleTitle.trim()} className="px-4 h-8 rounded-lg bg-white text-black font-bold text-[12px] disabled:opacity-50 hover:bg-zinc-200 transition-colors">
                  Save Role
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}