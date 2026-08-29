'use client'

import { CheckCircle, Sparkle } from '@phosphor-icons/react'

interface Props {
  venture: any
  membership: any
}

export function Step6_EnterVenture({ venture, membership }: Props) {
  return (
    <div className="space-y-8 text-center py-8">

      {/* Success icon */}
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border-2 border-emerald-500/30 flex items-center justify-center mx-auto">
        <CheckCircle size={40} weight="fill" className="text-emerald-400" />
      </div>

      <div>
        <h1 className="text-[28px] font-bold text-white leading-tight">
          You're All Set
        </h1>
        <p className="text-[14px] text-zinc-400 mt-3 max-w-md mx-auto leading-relaxed">
          You're now an active member of {venture.name}. Time to start building.
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
        <SummaryChip icon={Sparkle} label={membership.role_title || 'Team Member'} />
        {membership.position?.team_name && (
          <SummaryChip label={membership.position.team_name} />
        )}
        <SummaryChip
          label={`${Array.isArray(membership.permissions) ? membership.permissions.length : 0} permissions`}
        />
      </div>

      {/* What's next */}
      <div className="bg-[#121215] border border-white/[0.06] rounded-2xl p-6 text-left max-w-md mx-auto">
        <p className="text-[10.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-3">
          What Happens Next
        </p>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[9px] font-bold text-zinc-400">1</span>
            </div>
            <p className="text-[12.5px] text-zinc-300 leading-relaxed">
              Click "Enter Venture" below to open your team workspace
            </p>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[9px] font-bold text-zinc-400">2</span>
            </div>
            <p className="text-[12.5px] text-zinc-300 leading-relaxed">
              Explore documents, updates, and get to know your teammates
            </p>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[9px] font-bold text-zinc-400">3</span>
            </div>
            <p className="text-[12.5px] text-zinc-300 leading-relaxed">
              Start contributing — publish updates, add to the knowledge base, ship things
            </p>
          </li>
        </ul>
      </div>

      <p className="text-[11.5px] text-zinc-600 max-w-md mx-auto leading-relaxed">
        This venture will now appear in your "My Ventures" page. You can leave at any time
        from the team workspace.
      </p>
    </div>
  )
}

function SummaryChip({ icon: Icon, label }: { icon?: any; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11.5px] font-semibold text-zinc-300">
      {Icon && <Icon size={11} weight="fill" className="text-emerald-400" />}
      {label}
    </span>
  )
}