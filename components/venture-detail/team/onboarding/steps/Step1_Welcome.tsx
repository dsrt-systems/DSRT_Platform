'use client'

import { Sparkle, Envelope } from '@phosphor-icons/react'

interface Props {
  venture: any
  membership: any
}

export function Step1_Welcome({ venture, membership }: Props) {
  const personalMessage = membership.invitation?.personal_message
  const inviter = membership.invited_by

  return (
    <div className="space-y-8">

      {/* Hero */}
      <div className="text-center py-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
          <Sparkle size={32} weight="fill" className="text-emerald-400" />
        </div>
        <h1 className="text-[28px] font-bold text-white leading-tight">
          Welcome to <span className="text-emerald-400">{venture.name}</span>
        </h1>
        <p className="text-[14px] text-zinc-400 mt-3 max-w-md mx-auto leading-relaxed">
          You've officially joined the team as a{' '}
          <strong className="text-white">
            {membership.role_title || membership.position?.title || 'Team Member'}
          </strong>.
        </p>
      </div>

      {/* Venture card */}
      <div className="bg-[#121215] border border-white/[0.06] rounded-2xl overflow-hidden">
        {venture.cover_url && (
          <div className="h-32 relative overflow-hidden">
            <img
              src={venture.cover_url}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-transparent" />
          </div>
        )}

        <div className="p-6">
          {venture.tagline && (
            <p className="text-[14px] text-zinc-200 leading-relaxed italic">
              "{venture.tagline}"
            </p>
          )}
          {venture.description && (
            <p className="text-[13px] text-zinc-400 leading-relaxed mt-3">
              {venture.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-4 text-[11.5px] text-zinc-500">
            {venture.industry && <span>{venture.industry}</span>}
            {venture.stage && (
              <>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span className="capitalize">{venture.stage}</span>
              </>
            )}
            {venture.headquarters && (
              <>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span>{venture.headquarters}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Personal message from inviter */}
      {personalMessage && inviter && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
              {inviter.avatar_url ? (
                <img src={inviter.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                inviter.full_name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Envelope size={12} className="text-zinc-500" />
                <p className="text-[10.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
                  A note from {inviter.full_name?.split(' ')[0]}
                </p>
              </div>
              <p className="text-[13.5px] text-zinc-200 italic leading-relaxed">
                "{personalMessage}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next up */}
      <div className="text-center pt-4">
        <p className="text-[11.5px] text-zinc-500">
          Next, we'll walk you through your position, team, and access.
        </p>
      </div>
    </div>
  )
}