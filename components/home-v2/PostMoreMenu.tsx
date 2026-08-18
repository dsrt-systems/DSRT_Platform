'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Trash, PencilSimple, PushPin, Link as LinkIcon, Flag, EyeSlash, SpeakerSimpleSlash, Check } from '@phosphor-icons/react'

interface Props {
  post: any
  isOwn: boolean
  onClose: () => void
  onDeleted?: () => void
  onRefresh?: () => void
}

export function PostMoreMenu({ post, isOwn, onClose, onDeleted, onRefresh }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    setTimeout(() => window.addEventListener('click', handler), 0)
    return () => window.removeEventListener('click', handler)
  }, [onClose])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`)
      setCopied(true)
      setTimeout(onClose, 800)
    } catch {}
  }

  const handleDelete = async () => {
    if (!confirm('Delete this post permanently?')) return
    try { await fetch(`/api/posts/${post.id}`, { method: 'DELETE' }); onDeleted?.() } catch {}
    onClose()
  }

  const handlePin = async () => {
    try { await fetch(`/api/posts/${post.id}/pin`, { method: 'POST' }); onRefresh?.() } catch {}
    onClose()
  }

  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 w-56 rounded-lg overflow-hidden z-40 bg-[#0f0f0f] border border-zinc-800 shadow-[0_8px_28px_rgba(0,0,0,0.7)] py-1">
      <Btn Icon={copied ? Check : LinkIcon} label={copied ? 'Copied!' : 'Copy link'} onClick={copyLink} />
      {isOwn && (
        <>
          <div className="my-1 border-t border-zinc-800" />
          <Btn Icon={PushPin} label={post.is_pinned ? 'Unpin' : 'Pin post'} onClick={handlePin} />
          <Btn Icon={Trash} label="Delete post" onClick={handleDelete} destructive />
        </>
      )}
      {!isOwn && (
        <>
          <div className="my-1 border-t border-zinc-800" />
          <Btn Icon={EyeSlash} label="Not interested" onClick={onClose} />
          <Btn Icon={SpeakerSimpleSlash} label="Mute author" onClick={onClose} />
          <div className="my-1 border-t border-zinc-800" />
          <Btn Icon={Flag} label="Report" onClick={onClose} destructive />
        </>
      )}
    </div>
  )
}

function Btn({ Icon, label, onClick, destructive }: { Icon: any; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick() }}
      className={'w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-medium transition-colors ' +
        (destructive ? 'text-red-400 hover:bg-red-500/10' : 'text-zinc-300 hover:text-white hover:bg-zinc-900')}>
      <Icon size={13} weight="regular" />{label}
    </button>
  )
}