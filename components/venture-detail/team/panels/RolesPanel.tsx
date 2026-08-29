'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, Plus, Pencil, Check, X, CircleNotch } from '@phosphor-icons/react'
import { CustomRoleEditor } from '../roles-management/CustomRoleEditor'

interface Props {
  slug: string
  isOwner: boolean
}

export function RolesPanel({ slug, isOwner }: Props) {
  const [roles, setRoles] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [rolePerms, setRolePerms] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<any | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ventures/${slug}/team/roles`)
      const data = await res.json()
      setRoles(data.roles || [])
      setPermissions(data.permissions || [])
      setRolePerms(data.role_permissions || {})
    } catch {}
    setLoading(false)
  }, [slug])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="bg-[#121215] border border-white/[0.06] rounded-2xl p-12 text-center text-[12.5px] text-zinc-500">
        <CircleNotch size={14} className="animate-spin inline mr-2" /> Loading roles…
      </div>
    )
  }

  const systemRoles = roles.filter(r => r.is_system)
  const customRoles = roles.filter(r => r.is_custom)

  const byCategory: Record<string, any[]> = {}
  permissions.forEach(p => {
    if (!byCategory[p.category]) byCategory[p.category] = []
    byCategory[p.category].push(p)
  })

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="bg-[#121215] border border-white/[0.06] rounded-2xl p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <ShieldCheck size={18} className="text-zinc-300" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-white">Roles & Permissions</h3>
            <p className="text-[11.5px] text-zinc-500 mt-0.5 leading-relaxed max-w-lg">
              {systemRoles.length} system roles · {customRoles.length} custom roles.
              System roles cannot be edited; create custom roles for venture-specific permissions.
            </p>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={() => { setEditingRole(null); setEditorOpen(true) }}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white text-black text-[12px] font-bold hover:bg-zinc-200 transition-colors shadow-sm flex-shrink-0"
          >
            <Plus size={12} weight="bold" /> Custom Role
          </button>
        )}
      </div>

      {/* Custom Roles */}
      {customRoles.length > 0 && (
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
            Custom Roles
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {customRoles.map(r => (
              <div key={r.id} className="bg-[#121215] border border-white/[0.06] rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={13} className="text-purple-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-bold text-white truncate">{r.name}</p>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300">
                      Custom
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{r.description}</p>
                  )}
                  <p className="text-[10px] text-zinc-600 mt-1">
                    {(rolePerms[r.id] || []).length} permission{(rolePerms[r.id] || []).length !== 1 ? 's' : ''}
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => { setEditingRole(r); setEditorOpen(true) }}
                    className="text-zinc-500 hover:text-white p-1"
                  >
                    <Pencil size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matrix */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
          Permission Matrix
        </p>
        <div className="bg-[#121215] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold sticky left-0 bg-[#121215] z-10">
                    Permission
                  </th>
                  {roles.map(r => (
                    <th key={r.id} className="text-center px-3 py-3 min-w-[110px]">
                      <p className="text-[11px] font-bold text-white truncate">{r.name}</p>
                      {r.is_custom && (
                        <p className="text-[8px] font-mono uppercase tracking-wider text-purple-400 mt-0.5">Custom</p>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(byCategory).map(([category, perms]) => (
                  <>
                    <tr key={`cat-${category}`} className="bg-white/[0.02]">
                      <td colSpan={roles.length + 1} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
                        {category}
                      </td>
                    </tr>
                    {perms.map(p => (
                      <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                        <td className="px-4 py-2.5 sticky left-0 bg-[#121215]">
                          <p className="text-[12px] font-semibold text-white">{p.label}</p>
                          <p className="text-[10.5px] text-zinc-500 mt-0.5">{p.description}</p>
                        </td>
                        {roles.map(r => {
                          const granted = (rolePerms[r.id] || []).includes(p.id)
                          return (
                            <td key={r.id} className="text-center px-3 py-2.5">
                              {granted ? (
                                <Check size={14} weight="bold" className="text-emerald-400 inline-block" />
                              ) : (
                                <X size={12} className="text-zinc-700 inline-block" />
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {editorOpen && (
        <CustomRoleEditor
          open={editorOpen}
          onClose={() => { setEditorOpen(false); setEditingRole(null) }}
          slug={slug}
          existingRole={editingRole}
          permissions={permissions}
          existingPermissions={editingRole ? rolePerms[editingRole.id] : []}
          onSuccess={load}
        />
      )}
    </div>
  )
}