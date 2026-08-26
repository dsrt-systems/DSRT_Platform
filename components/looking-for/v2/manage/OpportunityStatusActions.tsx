'use client'

import Link from 'next/link'
import {
  Eye, Play, Pause, CheckCircle, Archive, Trash,
  PencilSimple, Link as LinkIcon, ShareNetwork,
  ChartLine, Copy, Clock,
} from '@phosphor-icons/react'

interface Props {
  opportunity: any
  onClose: () => void
  onRefresh: () => void
  onView: () => void
}

export function OpportunityStatusActions({ opportunity, onClose, onRefresh, onView }: Props) {
  const updateStatus = async (status: string, action?: string) => {
    // Optimistic parent refresh after server confirms
    try {
      await fetch(`/api/opportunities/${opportunity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      // Fire audit-ish event
      await fetch(`/api/opportunities/${opportunity.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: action || `opportunity_${status}`,
          source: 'my_opportunities',
        }),
      }).catch(() => {})
      onRefresh()
    } catch {}
  }

  const copyLink = async () => {
    const url = `${window.location.origin}/looking-for/${opportunity.slug || opportunity.id}`
    await navigator.clipboard.writeText(url)
    onClose()
  }

  const share = async () => {
    const url = `${window.location.origin}/looking-for/${opportunity.slug || opportunity.id}`
    if (navigator.share) {
      await navigator.share({ title: opportunity.title, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url)
    }
    await fetch(`/api/opportunities/${opportunity.id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'opportunity_shared', source: 'my_opportunities' }),
    }).catch(() => {})
    onClose()
  }

  const duplicate = async () => {
  try {
    const res = await fetch(`/api/opportunities/${opportunity.id}/duplicate`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'Duplicate failed')
    onClose()
    // Open the editor for the new draft
    window.location.href = `/looking-for/create?edit=${data.opportunity?.id}`
  } catch (e: any) {
    alert(e?.message || 'Duplicate failed')
  }
}

  const deleteOpportunity = async () => {
    if (!confirm('Delete this opportunity permanently? This cannot be undone.')) return
    try {
      await fetch(`/api/opportunities/${opportunity.id}`, { method: 'DELETE' })
      onRefresh()
    } catch {}
  }

  const status = opportunity.status
  const isDraft = status === 'draft'
  const isActive = status === 'active' || status === 'closing-soon'
  const isPaused = status === 'paused'
  const isClosed = ['closed', 'filled', 'archived', 'expired'].includes(status)

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-full mt-1 w-60 rounded-xl border border-zinc-800 bg-[#0c0c0e] shadow-[0_12px_40px_rgba(0,0,0,0.7)] z-40 py-1.5 overflow-hidden"
    >
      <MenuItem onClick={() => { onView(); onClose() }} Icon={Eye}>Preview public page</MenuItem>
      <MenuItem href={`/looking-for/create?edit=${opportunity.id}`} Icon={PencilSimple}>Edit</MenuItem>
      <MenuItem href={`/looking-for/my-opportunities/${opportunity.id}?tab=analytics`} Icon={ChartLine}>View analytics</MenuItem>

      <Divider />

      <MenuItem onClick={copyLink} Icon={LinkIcon}>Copy link</MenuItem>
      <MenuItem onClick={share} Icon={ShareNetwork}>Share</MenuItem>
      <MenuItem onClick={duplicate} Icon={Copy}>Duplicate</MenuItem>

      <Divider />

      {isDraft && (
        <MenuItem onClick={() => { updateStatus('active', 'opportunity_published'); onClose() }} Icon={Play}>
          Publish
        </MenuItem>
      )}
      {isActive && (
        <MenuItem onClick={() => { updateStatus('paused', 'opportunity_paused'); onClose() }} Icon={Pause}>
          Pause applications
        </MenuItem>
      )}
      {isPaused && (
        <MenuItem onClick={() => { updateStatus('active', 'opportunity_resumed'); onClose() }} Icon={Play}>
          Resume
        </MenuItem>
      )}
      {!isClosed && opportunity.application_deadline && (
        <MenuItem
          onClick={async () => {
            const d = new Date(opportunity.application_deadline)
            d.setDate(d.getDate() + 7)
            await fetch(`/api/opportunities/${opportunity.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ application_deadline: d.toISOString() }),
            })
            onRefresh()
            onClose()
          }}
          Icon={Clock}
        >
          Extend deadline +7d
        </MenuItem>
      )}
      {!isClosed && (
        <MenuItem onClick={() => { updateStatus('filled'); onClose() }} Icon={CheckCircle}>
          Mark as filled
        </MenuItem>
      )}
      {!isClosed && (
        <MenuItem onClick={() => { updateStatus('closed', 'opportunity_closed'); onClose() }} Icon={Archive}>
          Close opportunity
        </MenuItem>
      )}
      {status !== 'archived' && (
        <MenuItem onClick={() => { updateStatus('archived'); onClose() }} Icon={Archive}>
          Archive
        </MenuItem>
      )}

      <Divider />

      <MenuItem onClick={() => { deleteOpportunity(); onClose() }} Icon={Trash} destructive>
        Delete
      </MenuItem>
    </div>
  )
}

function Divider() {
  return <div className="my-1.5 border-t border-zinc-800/80" />
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
    'w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] transition-colors ' +
    (destructive
      ? 'text-red-400 hover:bg-red-500/10'
      : 'text-zinc-300 hover:bg-zinc-900 hover:text-white')

  if (href) {
    return (
      <Link href={href} className={cls}>
        <Icon size={13} weight="regular" />
        {children}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      <Icon size={13} weight="regular" />
      {children}
    </button>
  )
}