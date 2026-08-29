'use client'

import { useMemo, useCallback, useRef } from 'react'
import { 
  ReactFlow, Background, Controls, MiniMap, 
  useNodesState, useEdgesState, addEdge, 
  Connection, Edge, Node, ReactFlowProvider 
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { TeamPositionNode } from './TeamPositionNode'

interface Props {
  slug: string
  data: {
    positions: any[]
    relationships: any[]
    memberships: any[]
    layout: any[]
  }
  isOwner: boolean
  onNodeSelect: (id: string | null) => void
  onRefresh: () => void
}

const nodeTypes = {
  teamPosition: TeamPositionNode
}

export function TeamGraphCanvas({ slug, data, isOwner, onNodeSelect, onRefresh }: Props) {
  return (
    <ReactFlowProvider>
      <CanvasCore slug={slug} data={data} isOwner={isOwner} onNodeSelect={onNodeSelect} onRefresh={onRefresh} />
    </ReactFlowProvider>
  )
}

function CanvasCore({ slug, data, isOwner, onNodeSelect, onRefresh }: Props) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 1. Transform Domain Data to Nodes
  const initialNodes: Node[] = useMemo(() => {
    return data.positions.map((pos) => {
      // Find occupants for this position
      const occupants = data.memberships.filter(m => m.position_id === pos.id)
      
      // Find saved layout coordinates
      const layout = data.layout.find(l => l.position_id === pos.id)
      
      // Auto-layout fallback if no coordinates exist (simple horizontal scatter)
      const x = layout ? parseFloat(layout.x) : Math.random() * 200
      const y = layout ? parseFloat(layout.y) : Math.random() * 200

      return {
        id: pos.id,
        type: 'teamPosition',
        position: { x, y },
        data: {
          position: pos,
          occupants,
          isOwner
        },
      }
    })
  }, [data, isOwner])

  // 2. Transform Relationships to Edges
  const initialEdges: Edge[] = useMemo(() => {
    return data.relationships.map(rel => ({
      id: rel.id,
      source: rel.source_position_id,
      target: rel.target_position_id,
      type: 'smoothstep',
      animated: rel.relationship_type === 'advises' || rel.relationship_type === 'collaborates_with',
      style: { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2 },
    }))
  }, [data.relationships])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // 3. Handle Node Selection
  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    if (nodes.length === 1) {
      onNodeSelect(nodes[0].id)
    } else {
      onNodeSelect(null)
    }
  }, [onNodeSelect])

  // 4. Autosave Layout (Debounced)
  const handleNodeDragStop = useCallback((event: any, node: Node) => {
    if (!isOwner) return

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    
    saveTimeoutRef.current = setTimeout(async () => {
      // Grab latest coordinates for all nodes to bulk save
      const layouts = nodes.map(n => ({
        position_id: n.id,
        x: n.position.x,
        y: n.position.y
      }))

      try {
        await fetch(`/api/ventures/${slug}/team/layout`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layouts })
        })
      } catch (e) {
        console.error('Failed to save layout', e)
      }
    }, 1000)
  }, [isOwner, nodes, slug])

  // 5. Connect edges (Domain Mutation)
  const onConnect = useCallback(async (params: Connection) => {
    if (!isOwner) return
    
    // Optimistic UI update
    setEdges((eds) => addEdge({ ...params, type: 'smoothstep', style: { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2 } }, eds))
    
    // Persist to database (relationship_type defaults to 'reports_to')
    try {
      await fetch(`/api/ventures/${slug}/team/relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_position_id: params.source,
          target_position_id: params.target,
          relationship_type: 'reports_to'
        })
      })
      onRefresh()
    } catch (e) {
      // Revert on error
      onRefresh()
    }
  }, [setEdges, isOwner, slug, onRefresh])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onSelectionChange={onSelectionChange}
      onNodeDragStop={handleNodeDragStop}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.2}
      maxZoom={1.5}
      proOptions={{ hideAttribution: true }}
      className="bg-[#09090b]"
      nodesConnectable={isOwner}
      nodesDraggable={isOwner}
      elementsSelectable={true}
    >
      <Background color="rgba(255,255,255,0.05)" gap={20} size={1} />
      <Controls 
        className="!bg-[#121215] !border-zinc-800 !rounded-lg !overflow-hidden fill-white" 
        style={{ border: '1px solid rgba(255,255,255,0.1)' }} 
      />
      <MiniMap 
        nodeColor="rgba(255,255,255,0.2)"
        maskColor="rgba(0,0,0,0.4)"
        className="!bg-[#121215] !border-zinc-800 !rounded-lg"
      />
    </ReactFlow>
  )
}