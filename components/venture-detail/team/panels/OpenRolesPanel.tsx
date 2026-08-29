'use client'

import { OpenRolesSection } from '../open-roles/OpenRolesSection'

interface Props {
  slug: string
  ventureId: string
  isOwner: boolean
  positions?: any[]
}

export function OpenRolesPanel({ slug, ventureId, isOwner, positions = [] }: Props) {
  return (
    <OpenRolesSection
      slug={slug}
      ventureId={ventureId}
      isOwner={isOwner}
      positions={positions}
    />
  )
}