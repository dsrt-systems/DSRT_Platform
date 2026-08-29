'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin, Clock, CurrencyDollar, Lightning, Users, Eye,
  ChartBar, ArrowRight, LinkSimple, DotsThree, Pencil, Trash,
  Prohibit, ArrowSquareOut, Sparkle
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { OpenRole } from './hooks/useOpenRoles'
import { ApplicationStatsMini } from './ApplicationStatsMini'

interface Props {
  role: OpenRole
  positions: any[]
  slug: string
  isOwner: boolean
  onLinkClick: (role: OpenRole) => void
  onReload: () => void
}

export function OpenRoleCard({
  role, positions, slug, isOwner, onLinkClick, onReload
}: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [processing, setProcessing] = useState(false)

  const isActive = ['active', 'closing-soon'].includes(role.status)
  const isDraft = role.status === 'draft'
  const isClosed = ['closed', 'filled', 'archived', 'expired'].includes(role.status)

  const linkedPosition = role.linked_position_id
    ? positions.find(p => p.id === role.linked_position_id)
    : null

  const handleOpen = () => {
    if (isDraft) {
      router.push(`/looking-for/create-v2/${role.id}`)
    } else {
      router.push(`/looking-for/${role.slug || role.id}`)
    }
  }

  const handleManageApplications = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/looking-for/my-opportunities/${role.id}?tab=applications`)
  }

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    if (!confirm(`Close "${role.title}"? Applicants will no longer be able to apply.`)) return

    setProcessing(true)
    try {
      const res = await fetch(`/api/opportunities/${role.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' })
      })
      if (!res.ok) throw new Error()
      toast.success('Role closed')
      onReload()
    } catch {
      toast.error('Could not close role')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div
      onClick={handleOpen}
      className={
        'group relative rounded-2xl border overflow-hidden cursor-pointer transition-all ' +
        (isActive
          ? 'border-white/[0.06] bg-gradient-to-br from-[#141419] to-[#0d0d10] hover:border-white/[0.14] hover:shadow-2xl'
          : isDraft
            ? 'border-blue-500/15 bg-gradient-to-br from-blue-500/[0.02] to-[#0d0d10] hover:border-blue-500/25'
            : 'border-white/[0.04] bg-[#0d0d10]/50 hover:border-white/[0.08] opacity-75 hover:opacity-100')
      }
    >
      {/* Top accent strip */}
      <div className={
        'h-0.5 w-full ' +
        (isActive ? 'bg-gradient-to-r from-emerald-500/30 via-emerald-500/10 to-transparent'
          : isDraft ? 'bg-gradient-to-r from-blue-500/30 via-blue-500/10 to-transparent'
          : 'bg-white/[0.03]')
      } />

      <div className="p-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-[16px] font-bold text-white leading-tight">
                {role.title}
              </h3>
              <StatusBadge status={role.status} urgency={role.urgency} />
              {linkedPosition && (
                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <LinkSimple size={9} weight="fill" />
                  Linked
                </span>
              )}
            </div>

            {role.subtitle && (
              <p className="text-[12.5px] text-zinc-400 leading-relaxed line-clamp-1">
                {role.subtitle}
              </p>
            )}
          </div>

          {/* Kebab menu */}
          {isOwner && (
            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                className="w-7 h-7 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
              >
                <DotsThree size={16} weight="bold" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
                  <div className="absolute right-0 top-full mt-1 z-40 w-52 bg-[#0d0d10] border border-white/[0.08] rounded-xl shadow-2xl p-1">
                    <MenuItem
                      icon={Pencil}
                      label={isDraft ? 'Continue Editing' : 'Open in Studio'}
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); router.push(`/looking-for/create-v2/${role.id}`) }}
                    />
                    <MenuItem
                      icon={LinkSimple}
                      label={linkedPosition ? 'Manage Link' : 'Link to Position'}
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onLinkClick(role) }}
                    />
                    {isActive && (
                      <MenuItem
                        icon={ChartBar}
                        label="View Applications"
                        onClick={handleManageApplications}
                      />
                    )}
                    <div className="h-px bg-white/[0.06] my-1" />
                    {isActive && (
                      <MenuItem
                        icon={Prohibit}
                        label="Close Role"
                        onClick={handleClose}
                        destructive
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-zinc-500 mb-3">
          {role.work_mode && (
            <span className="flex items-center gap-1 capitalize">
              <MapPin size={11} /> {role.work_mode}
            </span>
          )}
          {role.location && <span>{role.location}</span>}
          {role.time_commitment && (
            <span className="flex items-center gap-1 capitalize">
              <Clock size={11} /> {role.time_commitment.replace('_', ' ').replace('-', ' ')}
            </span>
          )}
          {role.compensation_type && role.compensation_type !== 'none' && (
            <span className="flex items-center gap-1">
              <CurrencyDollar size={11} />
              {role.compensation_min && role.compensation_max
                ? `${role.compensation_currency || '$'}${formatK(role.compensation_min)}–${formatK(role.compensation_max)}`
                : role.compensation_type.replace('_', ' ')}
            </span>
          )}
          {role.experience_level && (
            <span className="capitalize">{role.experience_level.replace('-', ' ')}</span>
          )}
        </div>

        {/* Skills */}
        {Array.isArray(role.required_skills) && role.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {role.required_skills.slice(0, 6).map(s => (
              <span
                key={s}
                className="text-[10px] font-medium text-zinc-400 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded"
              >
                {s}
              </span>
            ))}
            {role.required_skills.length > 6 && (
              <span className="text-[10px] text-zinc-600 px-1">
                +{role.required_skills.length - 6}
              </span>
            )}
          </div>
        )}

        {/* Linked position info */}
        {linkedPosition && (
          <div className="mt-3 mb-3 p-2.5 rounded-lg bg-emerald-500/[0.03] border border-emerald-500/10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkle size={11} weight="fill" className="text-emerald-400 flex-shrink-0" />
                <p className="text-[11px] text-emerald-300 truncate">
                  Syncs with team position <strong className="text-white">{linkedPosition.title}</strong>
                </p>
              </div>
              <span className="text-[10px] text-emerald-400/80 font-mono font-bold flex-shrink-0">
                {linkedPosition.occupied_count || 0}/{linkedPosition.capacity || 1}
              </span>
            </div>
          </div>
        )}

        {/* Application stats + actions */}
        {isActive && (isOwner || (role.application_stats?.total || 0) > 0) && (
          <div className="mt-4 pt-3 border-t border-white/[0.05] space-y-2.5">
            {isOwner && role.application_stats && role.application_stats.total > 0 && (
              <ApplicationStatsMini stats={role.application_stats} />
            )}

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <Users size={11} />
                  {role.application_stats?.total || 0} {(role.application_stats?.total || 0) === 1 ? 'applicant' : 'applicants'}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={11} />
                  {role.view_count || 0} views
                </span>
                {role.positions_open !== undefined && (
                  <span className="flex items-center gap-1">
                    <Lightning size={11} />
                    {role.positions_open} {role.positions_open === 1 ? 'opening' : 'openings'}
                  </span>
                )}
              </div>

              {isOwner && (role.application_stats?.total || 0) > 0 && (
                <button
                  onClick={handleManageApplications}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] px-2.5 h-7 rounded-md transition-colors"
                >
                  Review Applicants
                  <ArrowRight size={10} weight="bold" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Draft: Continue CTA */}
        {isDraft && isOwner && (
          <div className="mt-4 pt-3 border-t border-white/[0.05]">
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/looking-for/create-v2/${role.id}`) }}
              className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 text-[11.5px] font-bold text-blue-300 transition-colors"
            >
              Continue Editing Draft
              <ArrowRight size={11} weight="bold" />
            </button>
          </div>
        )}

        {/* Published date footer */}
        <p className="text-[10px] text-zinc-600 mt-3">
          {role.published_at
            ? `Published ${new Date(role.published_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`
            : `Created ${new Date(role.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`
          }
        </p>
      </div>
    </div>
  )
}

function StatusBadge({ status, urgency }: { status: string; urgency?: string }) {
  const configs: Record<string, { label: string; color: string }> = {
    active: { label: 'Active', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
    'closing-soon': { label: 'Closing Soon', color: 'text-amber-300 bg-amber-500/10 border-amber-500/20' },
    draft: { label: 'Draft', color: 'text-blue-300 bg-blue-500/10 border-blue-500/20' },
    filled: { label: 'Filled', color: 'text-zinc-400 bg-zinc-800 border-zinc-700' },
    closed: { label: 'Closed', color: 'text-zinc-500 bg-zinc-800/60 border-zinc-700' },
    archived: { label: 'Archived', color: 'text-zinc-500 bg-zinc-800/60 border-zinc-700' },
    expired: { label: 'Expired', color: 'text-zinc-500 bg-zinc-800/60 border-zinc-700' },
  }
  const c = configs[status] || configs.active

  return (
    <>
      <span className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${c.color}`}>
        {c.label}
      </span>
      {urgency === 'urgent' && status === 'active' && (
        <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-300">
          <Lightning size={9} weight="fill" /> Urgent
        </span>
      )}
    </>
  )
}

function MenuItem({ icon: Icon, label, onClick, destructive }: {
  icon: any
  label: string
  onClick: (e: React.MouseEvent) => void
  destructive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={
        'w-full flex items-center gap-2 px-3 py-2 text-[12px] font-semibold rounded-lg transition-colors ' +
        (destructive
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]')
      }
    >
      <Icon size={12} weight="bold" />
      {label}
    </button>
  )
}

function formatK(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `${n}`
}