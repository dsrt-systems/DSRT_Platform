'use client'

import { Briefcase, Users, CheckCircle } from '@phosphor-icons/react'

interface Props {
  membership: any
}

export function Step2_YourPosition({ membership }: Props) {
  const position = membership.position
  const roleTitle = membership.role_title || position?.title || 'Team Member'
  const responsibilities = position?.responsibilities || []
  const skills = position?.required_skills || []

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
          Your Role
        </p>
        <h2 className="text-[24px] font-bold text-white">Your Position</h2>
        <p className="text-[13px] text-zinc-400 mt-1">
          Here's what you're joining as and what's expected.
        </p>
      </div>

      {/* Role card */}
      <div className="bg-[#121215] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
            <Briefcase size={22} className="text-zinc-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[18px] font-bold text-white">{roleTitle}</h3>
            {position?.team_name && (
              <p className="text-[13px] text-zinc-400 mt-0.5">
                <Users size={11} className="inline mr-1" />
                {position.team_name}
                {position.department && <span className="text-zinc-600"> · {position.department}</span>}
              </p>
            )}
          </div>
        </div>

        {position?.description && (
          <p className="text-[13px] text-zinc-300 leading-relaxed mt-4">
            {position.description}
          </p>
        )}
      </div>

      {/* Responsibilities */}
      {responsibilities.length > 0 && (
        <div className="bg-[#121215] border border-white/[0.06] rounded-2xl p-6">
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-3">
            Your Responsibilities
          </p>
          <ul className="space-y-2.5">
            {responsibilities.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle size={14} weight="fill" className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-[13px] text-zinc-300 leading-relaxed">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="bg-[#121215] border border-white/[0.06] rounded-2xl p-6">
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-3">
            Relevant Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s: string, i: number) => (
              <span
                key={i}
                className="text-[11px] px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-zinc-300 font-medium capitalize"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}