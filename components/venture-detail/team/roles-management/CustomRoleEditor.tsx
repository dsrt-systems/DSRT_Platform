'use client'

import { useState, useEffect } from 'react'
import { X, CircleNotch, Check, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  slug: string
  existingRole?: any | null
  permissions: any[]
  existingPermissions?: string[]
  onSuccess: () => void
}

export function CustomRoleEditor({
  open, onClose, slug, existingRole, permissions, existingPermissions, onSuccess
}: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(existingRole?.name || '')
      setDescription(existingRole?.description || '')
      setSelectedPerms(existingPermissions || [])
    }
  }, [open, existingRole, existingPermissions])

  if (!open) return null

  const isEdit = !!existingRole

  const grouped = permissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {} as Record<string, any[]>)

  const togglePermission = (id: string) => {
    setSelectedPerms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const url = isEdit
        ? `/api/ventures/${slug}/team/roles/${existingRole.id}`
        : `/api/ventures/${slug}/team/roles`
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          permissions: selectedPerms
        })
      })
      if (!res.ok) throw new Error()
      toast.success(isEdit ? 'Role updated' : 'Custom role created')
      onSuccess()
      onClose()
    } catch {
      toast.error('Could not save role')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!isEdit) return
    if (!confirm(`Delete "${existingRole.name}"? This action cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/ventures/${slug}/team/roles/${existingRole.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      toast.success('Role deleted')
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#121215] border border-white/[0.1] rounded-2xl w-full max-w-xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>

        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-white">
            {isEdit ? 'Edit Custom Role' : 'Create Custom Role'}
          </h3>
          <button onClick={onClose} disabled={saving || deleting} className="text-zinc-500 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
              Role Name *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Head of Growth"
              className="w-full h-10 px-3 bg-[#0d0d10] border border-white/[0.06] rounded-lg text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of this role's scope..."
              rows={2}
              maxLength={300}
              className="w-full p-3 bg-[#0d0d10] border border-white/[0.06] rounded-lg text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15] resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
              Permissions ({selectedPerms.length})
            </label>
            <div className="bg-[#0d0d10] border border-white/[0.06] rounded-xl divide-y divide-white/[0.04]">
              {Object.entries(grouped).map(([category, perms]) => (
                <div key={category} className="p-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
                    {category}
                  </p>
                  <div className="space-y-1">
                    {(perms as any[]).map(p => {
                      const checked = selectedPerms.includes(p.id)
                      return (
                        <button
                          key={p.id}
                          onClick={() => togglePermission(p.id)}
                          className="w-full flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-white/[0.02] text-left"
                        >
                          <div className={
                            'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ' +
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

        <div className="px-5 py-4 border-t border-white/[0.06] bg-[#0d0d10] flex items-center justify-between gap-2">
          {isEdit ? (
            <button
              onClick={handleDelete}
              disabled={saving || deleting}
              className="inline-flex items-center gap-1.5 px-3 h-9 text-[12px] font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              {deleting ? <CircleNotch size={12} className="animate-spin" /> : <Trash size={12} weight="bold" />}
              Delete Role
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <button onClick={onClose} disabled={saving || deleting} className="px-4 h-9 text-[12.5px] font-semibold text-zinc-400 hover:text-white">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || deleting || !name.trim()}
              className="inline-flex items-center gap-1.5 px-5 h-9 bg-white text-black rounded-lg text-[12.5px] font-bold hover:bg-zinc-200 disabled:opacity-40"
            >
              {saving ? <CircleNotch size={13} className="animate-spin" /> : (isEdit ? 'Save Changes' : 'Create Role')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}