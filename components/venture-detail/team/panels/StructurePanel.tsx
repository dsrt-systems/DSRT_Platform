'use client'

import { useMemo } from 'react'
import { ListBullets, CaretRight, User } from '@phosphor-icons/react'

interface Props {
  positions: any[]
  memberships: any[]
}

interface TreeNode {
  position: any
  occupants: any[]
  children: TreeNode[]
}

export function StructurePanel({ positions, memberships }: Props) {
  const tree = useMemo(() => buildTree(positions, memberships), [positions, memberships])

  if (positions.length === 0) {
    return (
      <div className="bg-[#121215] border border-white/[0.06] rounded-2xl p-16 text-center">
        <ListBullets size={32} className="text-zinc-600 mx-auto mb-3" />
        <h3 className="text-[14px] font-bold text-white mb-1">No organizational structure yet</h3>
        <p className="text-[12.5px] text-zinc-500">
          Add positions in the Graph view to build your structure.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#121215] border border-white/[0.06] rounded-2xl p-6">
      <div className="space-y-1">
        {tree.map(node => (
          <TreeNodeItem key={node.position.id} node={node} depth={0} />
        ))}
      </div>
    </div>
  )
}

function TreeNodeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const { position, occupants, children } = node
  const hasChildren = children.length > 0
  const primaryOccupant = occupants[0]

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {hasChildren ? (
          <CaretRight size={11} className="text-zinc-500 flex-shrink-0" />
        ) : (
          <div className="w-3 h-3" />
        )}

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
            {primaryOccupant?.user?.avatar_url ? (
              <img src={primaryOccupant.user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : primaryOccupant ? (
              (primaryOccupant.user?.full_name || 'M').charAt(0).toUpperCase()
            ) : (
              <User size={11} className="text-zinc-600" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{position.title}</p>
            <p className="text-[10.5px] text-zinc-500 truncate">
              {primaryOccupant?.user?.full_name || (
                <span className="italic text-zinc-600">Open · Recruiting</span>
              )}
              {position.team_name && (
                <span className="text-zinc-600"> · {position.team_name}</span>
              )}
            </p>
          </div>

          <span className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-500 flex-shrink-0">
            {position.occupied_count || 0}/{position.capacity || 1}
          </span>
        </div>
      </div>

      {hasChildren && (
        <div className="border-l border-white/[0.04] ml-[22px]">
          {children.map(child => (
            <TreeNodeItem key={child.position.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function buildTree(positions: any[], memberships: any[]): TreeNode[] {
  const nodes: Record<string, TreeNode> = {}

  positions.forEach(p => {
    nodes[p.id] = {
      position: p,
      occupants: memberships.filter(m => m.position_id === p.id && m.status === 'active'),
      children: []
    }
  })

  const roots: TreeNode[] = []
  positions.forEach(p => {
    if (p.parent_position_id && nodes[p.parent_position_id]) {
      nodes[p.parent_position_id].children.push(nodes[p.id])
    } else {
      roots.push(nodes[p.id])
    }
  })

  return roots
}