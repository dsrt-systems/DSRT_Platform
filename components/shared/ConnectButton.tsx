'use client'

import { useState } from 'react'
import { ComposeModal } from '@/components/inbox/ComposeModal'

interface Props {
  referenceType: 'project' | 'venture'
  referenceId: string
  referenceName: string
  referenceSlug: string
  size?: 'sm' | 'md'
}

export function ConnectButton({ referenceType, referenceId, referenceName, referenceSlug, size = 'md' }: Props) {
  const [open, setOpen] = useState(false)

  const isSmall = size === 'sm'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          'font-semibold rounded-md border border-white/[0.15] bg-white/[0.06] text-white hover:bg-white/[0.1] transition-colors ' +
          (isSmall ? 'text-[12px] h-8 px-3' : 'text-[13px] h-9 px-4')
        }
      >
        Connect
      </button>

      {open && (
        <ComposeModal
          referenceType={referenceType}
          referenceId={referenceId}
          referenceName={referenceName}
          referenceSlug={referenceSlug}
          onClose={() => setOpen(false)}
          onSent={() => setOpen(false)}
        />
      )}
    </>
  )
}
