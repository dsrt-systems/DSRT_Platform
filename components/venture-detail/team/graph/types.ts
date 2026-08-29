export type NodeType = 'person' | 'open_position' | 'team_group'

export type RelationshipType =
  | 'reports_to'
  | 'manages'
  | 'belongs_to'
  | 'leads'
  | 'advises'
  | 'collaborates_with'
  | 'responsible_for'

export interface NodeData {
  position: any
  occupants: any[]
  isOwner: boolean
  onInspect?: (positionId: string) => void
}

export interface EdgeData {
  label: RelationshipType
  isOwner: boolean
  onEdit?: (edgeId: string) => void
}

export interface LayoutSnapshot {
  positions: Record<string, { x: number; y: number }>
  timestamp: number
}

export const RELATIONSHIP_TYPES: {
  value: RelationshipType
  label: string
  description: string
  color: string
}[] = [
  { value: 'reports_to', label: 'Reports To', description: 'Direct manager relationship', color: '#60a5fa' },
  { value: 'manages', label: 'Manages', description: 'Manages the target', color: '#60a5fa' },
  { value: 'belongs_to', label: 'Belongs To', description: 'Member of a team/group', color: '#a78bfa' },
  { value: 'leads', label: 'Leads', description: 'Leadership role', color: '#f59e0b' },
  { value: 'advises', label: 'Advises', description: 'Advisory relationship', color: '#10b981' },
  { value: 'collaborates_with', label: 'Collaborates With', description: 'Peer collaboration', color: '#8b5cf6' },
  { value: 'responsible_for', label: 'Responsible For', description: 'Owns an area', color: '#ec4899' },
]