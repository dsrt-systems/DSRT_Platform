'use client'

import Link from 'next/link'
import {
  Eye, Play, Pause, CheckCircle, Archive, Copy, Trash,
  PencilSimple, ArrowUpRight,
} from '@phosphor-icons/react'

interface Props {
  opportunity: any
  onClose: () => void
  onRefresh: () => void
  onView: () => void
}

export function OpportunityStatusActions({ opportunity, onClose, onRefresh, onView }: Props) {
  const updateStatus = async (status: string) => {
    try {
      await fetch(`/api/opportunities/${opportunity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      onRefresh()
    } catch { }
  }

  const deleteOpportunity = async () => {
    if (!confirm('Delete this opportunity permanently? This cannot be undone.')) return
    try {
      await fetch(`/api/opportunities/${opportunity.id}`, { method: 'DELETE' })
      onRefresh()
    } catch { }
  }

  const status = opportunity.status
  const isDraft = status === 'draft'
  const isActive = status === 'active' || status === 'closing-soon'
  const isPaused = status === 'paused'
  const isClosed = ['closed', 'filled', 'archived', 'expired'].includes(status)

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-full mt-1 w-56 rounded-md border border-zinc-800 bg-[#0f0f0f] shadow-[0_8px_24px_rgba(0,0,0,0.6)] z-40 py-1"
    >
      <MenuItem onClick={onView} Icon={Eye}>View public page</MenuItem>
      <MenuItem
        href={`/looking-for/create?edit=${opportunity.id}`}
        Icon={PencilSimple}
      >
        Edit
      </MenuItem>

      <div className="my-1 border-t border-zinc-800" />

      {isDraft && (
        <MenuItem onClick={() => { updateStatus('active'); onClose() }} Icon={Play}>
          Publish
        </MenuItem>
      )}
      {isActive && (
        <MenuItem onClick={() => { updateStatus('paused'); onClose() }} Icon={Pause}>
          Pause
        </MenuItem>
      )}
      {isPaused && (
        <MenuItem onClick={() => { updateStatus('active'); onClose() }} Icon={Play}>
          Resume
        </MenuItem>
      )}
      {!isClosed && (
        <MenuItem onClick={() => { updateStatus('filled'); onClose() }} Icon={CheckCircle}>
          Mark as filled
        </MenuItem>
      )}
      {!isClosed && (
        <MenuItem onClick={() => { updateStatus('closed'); onClose() }} Icon={Archive}>
          Close
        </MenuItem>
      )}
      {status !== 'archived' && (
        <MenuItem onClick={() => { updateStatus('archived'); onClose() }} Icon={Archive}>
          Archive
        </MenuItem>
      )}

      <div className="my-1 border-t border-zinc-800" />

      <MenuItem
        onClick={() => { deleteOpportunity(); onClose() }}
        Icon={Trash}
        destructive
      >
        Delete
      </MenuItem>
    </div>
  )
}

function MenuItem({
  children, href, onClick, Icon, destructive,
}: {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  Icon: any
  destructive?: boolean
}) {
  const cls =
    'w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors ' +
    (destructive
      ? 'text-red-400 hover:bg-red-500/10'
      : 'text-zinc-300 hover:bg-zinc-900 hover:text-white')

  if (href) {
    return (
      <Link href={href} className={cls}>
        <Icon size={12} weight="regular" />
        {children}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      <Icon size={12} weight="regular" />
      {children}
    </button>
  )
}