'use client'

import { useState, useRef, useEffect } from 'react'
import { DotsThree, Shield, PauseCircle, PlayCircle, UserMinus, SignOut } from '@phosphor-icons/react'

interface Props {
  membership: any
  isOwner: boolean
  isSelf: boolean
  onChangeRole: () => void
  onSuspend: () => void
  onRestore: () => void
  onRemove: () => void
  onLeave: () => void
}

export function MemberActionMenu({
  membership, isOwner, isSelf, onChangeRole, onSuspend, onRestore, onRemove, onLeave
}: Props) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = membership.status === 'active'
  const isSuspended = membership.status === 'suspended'

  // Nothing to show if no actions available
  if (!isOwner && !isSelf) return null

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="w-7 h-7 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
        aria-label="Member actions"
      >
        <DotsThree size={16} weight="bold" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-52 bg-[#0d0d10] border border-white/[0.08] rounded-xl shadow-2xl p-1">
          {isOwner && isActive && (
            <>
              <MenuItem icon={Shield} label="Change Role" onClick={() => { setOpen(false); onChangeRole() }} />
              <MenuItem icon={PauseCircle} label="Suspend Access" onClick={() => { setOpen(false); onSuspend() }} />
            </>
          )}

          {isOwner && isSuspended && (
            <MenuItem icon={PlayCircle} label="Restore Access" onClick={() => { setOpen(false); onRestore() }} highlight />
          )}

          {isOwner && !isSelf && (
            <>
              <div className="h-px bg-white/[0.06] my-1" />
              <MenuItem icon={UserMinus} label="Remove from Venture" onClick={() => { setOpen(false); onRemove() }} destructive />
            </>
          )}

          {isSelf && !isOwner && (
            <MenuItem icon={SignOut} label="Leave Venture" onClick={() => { setOpen(false); onLeave() }} destructive />
          )}
        </div>
      )}
    </div>
  )
}

function MenuItem({ icon: Icon, label, onClick, destructive, highlight }: {
  icon: any
  label: string
  onClick: () => void
  destructive?: boolean
  highlight?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={
        'w-full flex items-center gap-2 px-3 py-2 text-[12px] font-semibold rounded-lg transition-colors ' +
        (destructive
          ? 'text-red-400 hover:bg-red-500/10'
          : highlight
            ? 'text-emerald-400 hover:bg-emerald-500/10'
            : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]')
      }
    >
      <Icon size={12} weight="bold" />
      {label}
    </button>
  )
}