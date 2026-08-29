'use client'

import { VentureOpenRolesTab } from '../openroles/VentureOpenRolesTab'

interface Props {
  positions: any[]
  isOwner: boolean
  slug: string
  ventureId: string
}

export function TeamOpenRoles({ positions, isOwner, slug, ventureId }: Props) {
  return <VentureOpenRolesTab slug={slug} ventureId={ventureId} isOwner={isOwner} />
}