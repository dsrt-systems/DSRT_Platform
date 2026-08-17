'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  DotsThree, ArrowUpRight, Eye, Users, BookmarkSimple,
  Play, Pause, Copy, Archive, Trash, PencilSimple,
} from '@phosphor-icons/react'
import { OpportunityStatusActions } from './OpportunityStatusActions'

interface Props {
  opportunity: any
  onManage: () => void
  onView: () => void
  onRefresh: () => void
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  'active': { label: 'Active', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
  'closing-soon': { label: 'Closing soon', className: 'border-orange-500/30 bg-orange-500/10 text-orange-400' },
  'draft': { label: 'Draft', className: 'border-zinc-700 bg-zinc-900 text-zinc-400' },
  'paused': { label: 'Paused', className: 'border-amber-500/30 bg-amber-500/10 text-amber-400' },
  'filled': { label: 'Filled', className: 'border-blue-500/30 bg-blue-500/10 text-blue-400' },
  'closed': { label: 'Closed', className: 'border-zinc-700 bg-zinc-900 text-zinc-500' },
  'expired': { label: 'Expired', className: 'border-zinc-700 bg-zinc-900 text-zinc-500' },
  'archived': { label: 'Archived', className: 'border-zinc-700 bg-zinc-900 text-zinc-500' },
}

function timeAgo(iso: string): string {
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

export function OpportunityRow({ opportunity, onManage, onView, onRefresh }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const badge = STATUS_BADGES[opportunity.status] || STATUS_BADGES.active
  const contextName = opportunity.project?.name || opportunity.venture?.name || null

  useEffect(() => {
    const close = () => setMenuOpen(false)
    if (menuOpen) {
      window.addEventListener('click', close)
      return () => window.removeEventListener('click', close)
    }
  }, [menuOpen])

  return (
    <div className="group relative rounded-xl border border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 transition-colors shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-4 p-4">
        {/* Icon */}
        <div className="w-11 h-11 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center">
          {opportunity.venture?.logo_url ? (
            <img src={opportunity.venture.logo_url} alt="" className="w-full h-full object-cover" />
          ) : opportunity.project?.icon ? (
            <span className="text-lg">{opportunity.project.icon}</span>
          ) : opportunity.project?.cover_image_url ? (
            <img src={opportunity.project.cover_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[13px] font-bold text-zinc-500">
              {(opportunity.title || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <button
              onClick={onManage}
              className="text-[14px] font-bold text-white hover:text-blue-400 text-left truncate max-w-md transition-colors"
            >
              {opportunity.title}
            </button>
            <span className={
              'inline-flex items-center h-5 px-1.5 rounded text-[10px] font-medium uppercase tracking-wider border ' +
              badge.className
            }>
              {badge.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11.5px] text-zinc-500">
            {contextName && (
              <>
                <span className="text-zinc-400">{contextName}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
              </>
            )}
            <span>{opportunity.positions_open || 1} position{opportunity.positions_open !== 1 ? 's' : ''}</span>
            {opportunity.published_at && (
              <>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span>Posted {timeAgo(opportunity.published_at)}</span>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-5 shrink-0 pr-2">
          <StatMini Icon={Users} value={opportunity.application_count || 0} label="Apps" accent="blue" />
          <StatMini Icon={Eye} value={opportunity.view_count || 0} label="Views" />
          <StatMini Icon={BookmarkSimple} value={opportunity.save_count || 0} label="Saves" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onManage}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-zinc-800 hover:border-zinc-700 text-[12px] font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Manage
            <ArrowUpRight size={10} weight="bold" />
          </button>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
              className="w-8 h-8 rounded-md border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <DotsThree size={14} weight="bold" />
            </button>
            {menuOpen && (
              <OpportunityStatusActions
                opportunity={opportunity}
                onClose={() => setMenuOpen(false)}
                onRefresh={onRefresh}
                onView={onView}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatMini({ Icon, value, label, accent }: { Icon: any; value: number; label: string; accent?: 'blue' }) {
  return (
    <div className="text-center">
      <div className="flex items-center gap-1 justify-center mb-0.5">
        <Icon size={10} weight="regular" className="text-zinc-500" />
        <span className={
          'text-[13px] font-bold ' +
          (accent === 'blue' ? 'text-blue-400' : 'text-white')
        }>
          {value.toLocaleString()}
        </span>
      </div>
      <div className="text-[9.5px] font-medium uppercase tracking-wider text-zinc-500">{label}</div>
    </div>
  )
}