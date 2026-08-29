'use client'

import { CheckCircle, X } from '@phosphor-icons/react'

interface Props {
  membership: any
}

const ALL_PERMISSIONS = [
  { id: 'view_venture', label: 'View Venture Workspace', category: 'General' },
  { id: 'edit_overview', label: 'Edit Overview', category: 'General' },
  { id: 'view_team', label: 'View Team Directory', category: 'Team' },
  { id: 'invite_members', label: 'Invite Members', category: 'Team' },
  { id: 'manage_roles', label: 'Manage Roles', category: 'Team' },
  { id: 'publish_updates', label: 'Publish Updates', category: 'Content' },
  { id: 'manage_documents', label: 'Manage Knowledge Base', category: 'Content' },
  { id: 'manage_products', label: 'Manage Products', category: 'Content' },
  { id: 'view_financials', label: 'View Financials & Decks', category: 'Financial' },
  { id: 'manage_settings', label: 'Manage Settings', category: 'Admin' },
]

export function Step5_AccessConfirmation({ membership }: Props) {
  const granted = new Set(
    Array.isArray(membership.permissions) ? membership.permissions : []
  )

  const grouped = ALL_PERMISSIONS.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push({ ...p, granted: granted.has(p.id) })
    return acc
  }, {} as Record<string, Array<{ id: string; label: string; category: string; granted: boolean }>>)

  return (
    <div className="space-y-6">

      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
          Access
        </p>
        <h2 className="text-[24px] font-bold text-white">Your Permissions</h2>
        <p className="text-[13px] text-zinc-400 mt-1">
          Here's what you can and can't do inside the venture workspace.
        </p>
      </div>

      <div className="bg-[#121215] border border-white/[0.06] rounded-2xl divide-y divide-white/[0.04]">
        {Object.entries(grouped).map(([category, perms]) => (
          <div key={category} className="p-4">
            <p className="text-[10.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
              {category}
            </p>
            <div className="space-y-1">
              {perms.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-2.5 p-2 rounded-lg"
                >
                  {p.granted ? (
                    <CheckCircle size={14} weight="fill" className="text-emerald-400 flex-shrink-0" />
                  ) : (
                    <X size={12} weight="bold" className="text-zinc-700 flex-shrink-0" />
                  )}
                  <p className={
                    'text-[12.5px] font-medium ' +
                    (p.granted ? 'text-zinc-200' : 'text-zinc-600 line-through')
                  }>
                    {p.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
        <p className="text-[11.5px] text-zinc-500 leading-relaxed">
          <strong className="text-zinc-400">Need more access?</strong> Ask your venture owner —
          they can adjust your permissions or upgrade your role at any time.
        </p>
      </div>
    </div>
  )
}