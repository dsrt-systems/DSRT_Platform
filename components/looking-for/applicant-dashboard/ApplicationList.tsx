'use client'

import Link from 'next/link'
import {
  FileText,
  CheckCircle,
  PauseCircle,
  ChatCircle,
  Handshake,
  XCircle,
  ArrowUpRight,
  EnvelopeSimple,
  PencilSimple,
} from '@phosphor-icons/react'

// Fully aligned with DB pipeline_stage values, colored by intent.
const STAGE_META: Record<string, { label: string; Icon: any; className: string }> = {
  // In-progress / unresolved
  draft:        { label: 'Draft',        Icon: PencilSimple, className: 'border-zinc-700 bg-zinc-900 text-zinc-400' },
  submitted:    { label: 'Submitted',    Icon: CheckCircle,  className: 'border-zinc-700 bg-zinc-900 text-zinc-300' },
  applied:      { label: 'Submitted',    Icon: CheckCircle,  className: 'border-zinc-700 bg-zinc-900 text-zinc-300' },
  pending:      { label: 'Pending',      Icon: PauseCircle,  className: 'border-zinc-700 bg-zinc-900 text-zinc-300' },
  reviewing:    { label: 'Reviewing',    Icon: PauseCircle,  className: 'border-blue-500/30 bg-blue-500/10 text-blue-300' },
  screening:    { label: 'Shortlisted',  Icon: CheckCircle,  className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' },
  interviewing: { label: 'Interviewing', Icon: ChatCircle,   className: 'border-purple-500/30 bg-purple-500/10 text-purple-300' },
  offered:      { label: 'Offer',        Icon: Handshake,    className: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  hired:        { label: 'Selected',     Icon: CheckCircle,  className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
  rejected:     { label: 'Rejected',     Icon: XCircle,      className: 'border-red-500/30 bg-red-500/10 text-red-300' },
  withdrawn:    { label: 'Withdrawn',    Icon: XCircle,      className: 'border-zinc-700 bg-zinc-900 text-zinc-500' },

  // Legacy aliases (safe-fallbacks for old rows)
  'under-review': { label: 'Reviewing',    Icon: PauseCircle, className: 'border-blue-500/30 bg-blue-500/10 text-blue-300' },
  shortlisted:    { label: 'Shortlisted',  Icon: CheckCircle, className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' },
  interview:      { label: 'Interviewing', Icon: ChatCircle,  className: 'border-purple-500/30 bg-purple-500/10 text-purple-300' },
  offer:          { label: 'Offer',        Icon: Handshake,   className: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  accepted:       { label: 'Selected',     Icon: CheckCircle, className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
  declined:       { label: 'Rejected',     Icon: XCircle,     className: 'border-red-500/30 bg-red-500/10 text-red-300' },
}

function timeAgo(iso: string): string {
  if (!iso) return ''
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

export function ApplicationList({
  applications,
  filter,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  applications: any[]
  filter: string
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
}) {
  if (applications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 p-14 text-center bg-gradient-to-b from-zinc-900/20 to-transparent">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl border border-zinc-800 bg-zinc-950 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <FileText size={22} className="text-zinc-500" />
        </div>
        <h2 className="text-[17px] font-bold text-white mb-1.5">
          No {filter !== 'all' ? filter : ''} applications
        </h2>
        <p className="text-[13px] text-zinc-500 mb-6 max-w-md mx-auto leading-relaxed">
          {filter === 'drafts'
            ? "You don't have any in-progress applications."
            : 'When you apply for opportunities on DSRT, you can track their progress here.'}
        </p>
        <Link
          href="/looking-for"
          className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-zinc-100 transition-colors shadow-sm"
        >
          Explore Opportunities
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0f0f11] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800/80">
        <h3 className="text-[13px] font-bold text-white">Your Applications</h3>
      </div>
      <div className="divide-y divide-zinc-800/70">
        {applications.map((app) => {
          const opp = app.opportunity
          if (!opp) return null

          const meta = STAGE_META[app.pipeline_stage] || STAGE_META.submitted
          const contextName = opp.project?.name || opp.venture?.name || null
          const isDraft = app.pipeline_stage === 'draft'

          const href = isDraft
            ? `/looking-for/${opp.id}/apply/${app.id}`
            : `/looking-for/my-applications/${app.id}`

          return (
            <Link
              key={app.id}
              href={href}
              className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-900/30 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                {opp.venture?.logo_url ? (
                  <img src={opp.venture.logo_url} alt="" className="w-full h-full object-cover" />
                ) : opp.project?.icon ? (
                  <span className="text-xl">{opp.project.icon}</span>
                ) : opp.cover_image_url ? (
                  <img src={opp.cover_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[14px] font-bold text-zinc-500">
                    {(opp.title || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="text-[15px] font-bold text-white group-hover:text-blue-300 transition-colors truncate max-w-md">
                    {opp.title}
                  </h4>
                  {isDraft && (
                    <span className="inline-flex items-center h-5 px-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-500">
                      Draft
                    </span>
                  )}
                  {app.unread_messages > 0 && (
                    <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      <EnvelopeSimple size={10} weight="fill" />
                      {app.unread_messages} New
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[12px] text-zinc-500">
                  {contextName && (
                    <>
                      <span className="text-zinc-400 font-medium">{contextName}</span>
                      <span className="text-zinc-700">·</span>
                    </>
                  )}
                  <span className="capitalize">
                    {String(opp.opportunity_type || '').replace(/-/g, ' ')}
                  </span>
                  <span className="text-zinc-700">·</span>
                  <span>{isDraft ? 'Started' : 'Applied'} {timeAgo(app.created_at)}</span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-4 text-right">
                <div className="hidden sm:block text-right">
                  <div
                    className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${meta.className}`}
                  >
                    <meta.Icon size={12} weight={isDraft ? 'regular' : 'fill'} />
                    {meta.label}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-semibold">
                    Last update {timeAgo(app.stage_updated_at || app.updated_at)}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg border border-zinc-800 bg-zinc-950/50 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-800 group-hover:text-white transition-colors">
                  <ArrowUpRight size={14} weight="bold" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {hasMore && onLoadMore && (
        <div className="px-5 py-5 border-t border-zinc-800/80 flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="h-10 px-6 rounded-xl border border-zinc-800 hover:border-zinc-600 text-[13px] font-semibold text-zinc-300 hover:text-white transition-colors disabled:opacity-60"
          >
            {loadingMore ? 'Loading...' : 'Load more applications'}
          </button>
        </div>
      )}
    </div>
  )
}