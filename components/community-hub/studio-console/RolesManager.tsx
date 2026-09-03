'use client'

import { Crown, Shield, Gavel, User, Info } from 'lucide-react'
import { SectionHeader } from '@/components/kernel-ui'

const SYSTEM_ROLES = [
  {
    key: 'OWNER',
    name: 'Owner',
    icon: Crown,
    permissions: 'All permissions. Ownership can be transferred.',
    color: 'text-amber-300',
  },
  {
    key: 'ADMIN',
    name: 'Admin',
    icon: Shield,
    permissions: 'Manage members, content, moderation, and settings.',
    color: 'text-white/85',
  },
  {
    key: 'MODERATOR',
    name: 'Moderator',
    icon: Gavel,
    permissions: 'Review content, warn, remove, and ban.',
    color: 'text-white/70',
  },
  {
    key: 'MEMBER',
    name: 'Member',
    icon: User,
    permissions: 'Post, vote, participate.',
    color: 'text-white/60',
  },
]

export function RolesManager({ slug }: { slug: string }) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Roles & Permissions"
        description="System roles are managed here. Assign roles from Members."
        variant="mono"
      />

      <div className="grid gap-3">
        {SYSTEM_ROLES.map((r) => {
          const Icon = r.icon
          return (
            <div key={r.key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-start gap-4">
              <div className="w-11 h-11 rounded-lg border border-white/[0.06] bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                <Icon className={`w-5 h-5 ${r.color}`} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-[14px] font-semibold text-white">{r.name}</h4>
                  <span className="text-[9.5px] font-mono uppercase tracking-wider text-white/40 px-1.5 py-0.5 rounded border border-white/[0.06] bg-white/[0.02]">
                    system
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] text-white/60 leading-relaxed">{r.permissions}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-white/50" strokeWidth={1.75} />
          <p className="label-mono text-white/50">Custom roles</p>
        </div>
        <p className="text-[12.5px] text-white/60 leading-relaxed">
          Custom roles with fine-grained permission bundles (Event Organizer, Recruiter, etc.) arrive in a later phase.
          For now, assign a system role from Members management.
        </p>
      </div>
    </div>
  )
}