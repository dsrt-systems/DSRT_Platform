'use client'

import { useState, useEffect } from 'react'
import { X, CircleNotch, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  slug: string
  membership: any
  onSuccess: () => void
}

export function ChangeRoleModal({ open, onClose, slug, membership, onSuccess }: Props) {
  const [roles, setRoles] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [rolePermMap, setRolePermMap] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [roleTitle, setRoleTitle] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/ventures/${slug}/team/roles`)
        const data = await res.json()
        if (cancelled) return

        setRoles(data.roles || [])
        setPermissions(data.permissions || [])
        setRolePermMap(data.role_permissions || {})

        setSelectedRoleId(membership.role_id)
        setRoleTitle(membership.role_title || '')
        setSelectedPermissions(Array.isArray(membership.permissions) ? membership.permissions : [])
      } catch (e: any) {
        toast.error('Could not load roles')
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [open, slug, membership])

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId)
    const role = roles.find(r => r.id === roleId)
    if (role) {
      setRoleTitle(role.name)
      setSelectedPermissions(rolePermMap[roleId] || [])
    }
  }

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    )
  }

  const handleSave = async () => {
    if (!roleTitle.trim()) {
      toast.error('Role title is required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/ventures/${slug}/team/memberships/${membership.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_id: selectedRoleId,
          role_title: roleTitle.trim(),
          permissions: selectedPermissions
        })
      })
      if (!res.ok) throw new Error()
      toast.success('Role updated')
      onSuccess()
      onClose()
    } catch {
      toast.error('Could not update role')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const grouped = permissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#121215] border border-white/[0.1] rounded-2xl w-full max-w-xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>

        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-white">Change Role</h3>
            <p className="text-[11.5px] text-zinc-500 mt-0.5 truncate">
              {membership.user?.full_name || 'Team Member'}
            </p>
          </div>
          <button onClick={onClose} disabled={saving} className="text-zinc-500 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center text-[12.5px] text-zinc-500 gap-2">
            <CircleNotch size={14} className="animate-spin" /> Loading roles…
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Role selector */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
                  Role Template
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
                  {roles.map(r => (
                    <button
                      key={r.id}
                      onClick={() => handleRoleChange(r.id)}
                      className={
                        'p-3 rounded-lg border text-left transition-all ' +
                        (selectedRoleId === r.id
                          ? 'border-white/20 bg-white/[0.06]'
                          : 'border-white/[0.06] bg-[#0d0d10] hover:border-white/[0.12]')
                      }
                    >
                      <div className="flex items-center gap-1.5">
                        <p className="text-[12.5px] font-bold text-white truncate">{r.name}</p>
                        {r.is_custom && (
                          <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300">
                            Custom
                          </span>
                        )}
                      </div>
                      {r.description && (
                        <p className="text-[10.5px] text-zinc-500 mt-0.5 line-clamp-2">{r.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom title */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
                  Displayed Role Title
                </label>
                <input
                  value={roleTitle}
                  onChange={e => setRoleTitle(e.target.value)}
                  placeholder="e.g. Senior Product Designer"
                  className="w-full h-10 px-3 bg-[#0d0d10] border border-white/[0.06] rounded-lg text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15]"
                />
              </div>

              {/* Permissions matrix */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
                  Permissions ({selectedPermissions.length})
                </label>
                <div className="bg-[#0d0d10] border border-white/[0.06] rounded-xl divide-y divide-white/[0.04]">
                  {Object.entries(grouped).map(([category, perms]) => (
                    <div key={category} className="p-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
                        {category}
                      </p>
                      <div className="space-y-1">
                        {(perms as any[]).map(p => {
                          const checked = selectedPermissions.includes(p.id)
                          return (
                            <button
                              key={p.id}
                              onClick={() => togglePermission(p.id)}
                              className="w-full flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-white/[0.02] transition-colors text-left"
                            >
                              <div className={
                                'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ' +
                                (checked ? 'bg-white border-white' : 'border-zinc-700')
                              }>
                                {checked && <Check size={10} weight="bold" className="text-black" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={
                                  'text-[12px] font-semibold ' +
                                  (checked ? 'text-white' : 'text-zinc-400')
                                }>
                                  {p.label}
                                </p>
                                <p className="text-[10.5px] text-zinc-500 mt-0.5">{p.description}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-white/[0.06] bg-[#0d0d10] flex justify-end gap-2">
              <button onClick={onClose} disabled={saving} className="px-4 h-9 text-[12.5px] font-semibold text-zinc-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !roleTitle.trim()}
                className="inline-flex items-center gap-1.5 px-5 h-9 bg-white text-black rounded-lg text-[12.5px] font-bold hover:bg-zinc-200 disabled:opacity-40"
              >
                {saving ? <CircleNotch size={13} className="animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}