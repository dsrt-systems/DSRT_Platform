'use client'

import { InvitationComposer } from './invitation-composer/InvitationComposer'

interface Props {
  open: boolean
  onClose: () => void
  slug: string
  position: any
  onSuccess: () => void
  ventureName?: string
  positions?: any[]
}

export function TeamInviteModal({
  open, onClose, slug, position, onSuccess, ventureName, positions
}: Props) {
  return (
    <InvitationComposer
      open={open}
      onClose={onClose}
      slug={slug}
      ventureName={ventureName || 'Venture'}
      positions={positions || (position ? [position] : [])}
      onSuccess={onSuccess}
      preselectedPosition={position}
      source="position"
    />
  )
}