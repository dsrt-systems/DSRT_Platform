'use client'
import { VentureUpdatesSection } from '../overview/VentureUpdatesSection'

interface Props { venture: any; updates: any[]; slug: string; isOwner: boolean; currentUserId: string | null }

export function VentureUpdates({ venture, isOwner }: Props) {
  return <VentureUpdatesSection venture={venture} isOwner={isOwner} />
}