'use client'

import Link from 'next/link'
import {
  UserPlus,
  Rocket,
  FolderSimple,
  ArrowRight,
  CalendarBlank,
  CheckCircle,
} from '@phosphor-icons/react'

export function TeamInvitationMailCard({ message }: { message: any }) {
  const meta = message.metadata || {}
  const type = message.message_type

  // Only handle team invitation related messages
  if (type !== 'team_invitation' && type !== 'team_invitation_accepted') {
    return null
  }

  const destName = meta.destination_name || message.reference_name || 'the team'
  const destType = meta.destination_type // 'project' | 'venture'
  const role = meta.role || 'Team Member'
  const appId = meta.application_id
  const startDate = meta.start_date

  if (type === 'team_invitation_accepted') {
    return (
      <div className="mt-4 mb-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 max-w-md shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle size={18} weight="fill" className="text-emerald-400" />
          <h3 className="text-[14px] font-bold text-emerald-300">Invitation Accepted</h3>
        </div>
        <p className="text-[12.5px] text-zinc-300 leading-relaxed mb-4">
          The applicant has accepted your invitation and successfully joined <strong>{destName}</strong> as a <strong>{role}</strong>.
        </p>
        <Link
          href={destType === 'project' ? `/projects/${meta.destination_id}` : `/ventures/${meta.destination_id}`}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-[12px] font-semibold text-emerald-400 transition-colors"
        >
          Open Workspace <ArrowRight size={12} weight="bold" />
        </Link>
      </div>
    )
  }

  // Pending Team Invitation Card
  return (
    <div className="mt-4 mb-2 rounded-xl border border-zinc-800/80 bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0f0f11] overflow-hidden max-w-md shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
      {/* Top Banner */}
      <div className="px-5 py-3 border-b border-zinc-800/80 bg-zinc-950/50 flex items-center gap-2">
        <UserPlus size={16} className="text-blue-400" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
          Official Team Invitation
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Destination & Role */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
            {destType === 'venture' ? (
              <Rocket size={20} className="text-zinc-500" />
            ) : (
              <FolderSimple size={20} className="text-zinc-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-bold text-white truncate">{destName}</div>
            <div className="text-[13px] text-zinc-400 mt-0.5 truncate">{role}</div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-800/60">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Invited By
            </div>
            <div className="text-[12.5px] font-semibold text-zinc-200 truncate">
              {message.sender?.full_name || 'Employer'}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Start Date
            </div>
            <div className="text-[12.5px] font-semibold text-zinc-200 flex items-center gap-1.5">
              <CalendarBlank size={13} className="text-zinc-500" />
              {startDate ? new Date(startDate).toLocaleDateString() : 'TBD'}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <Link
            href={`/looking-for/my-applications/${appId}`}
            className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-white text-black hover:bg-zinc-200 text-[13px] font-bold transition-all shadow-[0_2px_12px_rgba(255,255,255,0.15)]"
          >
            Review & Respond <ArrowRight size={14} weight="bold" />
          </Link>
          <p className="text-center text-[10.5px] text-zinc-500 mt-3">
            This invitation was sent because you were selected for an opportunity.
          </p>
        </div>
      </div>
    </div>
  )
}