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

// ALL DSRT MONOCHROMATIC/PROFESSIONAL COLORS
export const RELATIONSHIP_TYPES: {
  value: RelationshipType
  label: string
  description: string
  color: string
}[] = [
  { value: 'reports_to', label: 'Reports To', description: 'Direct manager relationship', color: '#a1a1aa' },
  { value: 'manages', label: 'Manages', description: 'Manages the target', color: '#a1a1aa' },
  { value: 'belongs_to', label: 'Belongs To', description: 'Member of a team/group', color: '#71717a' },
  { value: 'leads', label: 'Leads', description: 'Leadership role', color: '#d4d4d8' },
  { value: 'advises', label: 'Advises', description: 'Advisory relationship', color: '#71717a' },
  { value: 'collaborates_with', label: 'Collaborates With', description: 'Peer collaboration', color: '#71717a' },
  { value: 'responsible_for', label: 'Responsible For', description: 'Owns an area', color: '#a1a1aa' },
]