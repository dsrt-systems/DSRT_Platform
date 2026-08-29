'use client'

import { useMemo, useCallback, useRef, useState } from 'react'
import { 
  ReactFlow, Background, Controls, MiniMap, 
  useNodesState, useEdgesState, addEdge, 
  Connection, Edge, Node, ReactFlowProvider 
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { TeamPositionNode } from './TeamPositionNode'
import { RelationshipEdge } from './edges/RelationshipEdge'
import { Trash, FlowArrow, ArrowsOutSimple, ArrowsInSimple, ArrowsClockwise } from '@phosphor-icons/react'
import { toast } from 'sonner'

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

const edgeTypes = {
  relationshipEdge: RelationshipEdge
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
  const [fullscreen, setFullscreen] = useState(false)
  const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null)
  
  // Undo-Redo Local Mutation State Commands Stack
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([])
  const [historyPointer, setHistoryPointer] = useState(-1)

  // Parse Database Structure layouts to UI Coordinates Map
  const initialNodes: Node[] = useMemo(() => {
    return data.positions.map((pos) => {
      const occupants = data.memberships.filter(m => m.position_id === pos.id)
      const layout = data.layout.find(l => l.position_id === pos.id)
      
      const x = layout ? parseFloat(layout.x) : Math.random() * 200
      const y = layout ? parseFloat(layout.y) : Math.random() * 200

      return {
        id: pos.id,
        type: 'teamPosition',
        position: { x, y },
        data: {
          position: pos,
          occupants,
          isOwner,
        },
      }
    })
  }, [data, isOwner])

  const initialEdges: Edge[] = useMemo(() => {
    return data.relationships.map(rel => ({
      id: rel.id,
      source: rel.source_position_id,
      target: rel.target_position_id,
      type: 'relationshipEdge',
      data: {
        label: rel.relationship_type || 'reports_to',
        isOwner,
        onDeleteEdge: async (edgeId: string) => {
          try {
            const res = await fetch(`/api/ventures/${slug}/team/relationships/${edgeId}`, {
              method: 'DELETE'
            })
            if (!res.ok) throw new Error()
            toast.success('Relationship connection severed')
            onRefresh()
          } catch {
            toast.error('Could not delete edge')
          }
        }
      }
    }))
  }, [data.relationships, isOwner, slug, onRefresh])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    if (nodes.length === 1) {
      onNodeSelect(nodes[0].id)
    } else {
      onNodeSelect(null)
    }
  }, [onNodeSelect])

  const handleNodeDragStop = useCallback((event: any, node: Node) => {
    if (!isOwner) return

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    
    saveTimeoutRef.current = setTimeout(async () => {
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
        console.error('Failed to save layout coordinates map', e)
      }
    }, 1200)
  }, [isOwner, nodes, slug])

  // Custom Edge connection routing trigger with explicit relationship select prompt
  const onConnect = useCallback(async (params: Connection) => {
    if (!isOwner) return
    
    const types = ['reports_to', 'manages', 'belongs_to', 'leads', 'advises', 'collaborates_with', 'responsible_for']
    const choice = prompt(`Select relationship type:\n\n${types.join('\n')}`, 'reports_to')
    const relationshipType = types.includes(choice || '') ? choice : 'reports_to'

    try {
      const res = await fetch(`/api/ventures/${slug}/team/relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_position_id: params.source,
          target_position_id: params.target,
          relationship_type: relationshipType
        })
      })
      if (!res.ok) throw new Error()
      toast.success('Relationship defined')
      onRefresh()
    } catch {
      toast.error('Could not construct edge map link')
    }
  }, [isOwner, slug, onRefresh])

  // Simple Auto-layout engine using a simple vertical layout distribution formula to resolve coordinates
  const triggerAutoLayout = useCallback(() => {
    let currentY = 50
    const updatedNodes = nodes.map((node, index) => {
      const level = Math.floor(index / 3)
      const col = index % 3
      return {
        ...node,
        position: {
          x: 100 + col * 320,
          y: 50 + level * 200
        }
      }
    })
    setNodes(updatedNodes)
    
    // Bulk save after positional update
    const layouts = updatedNodes.map(n => ({
      position_id: n.id,
      x: n.position.x,
      y: n.position.y
    }))
    
    fetch(`/api/ventures/${slug}/team/layout`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layouts })
    }).then(() => onRefresh())
  }, [nodes, slug, setNodes, onRefresh])

  return (
    <div className={`relative w-full h-full ${fullscreen ? 'fixed inset-0 z-50 bg-[#09090b]' : ''}`}>
      {/* Visual Canvas Layout Tool bar */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={triggerAutoLayout}
          className="flex items-center gap-1 bg-[#121215] border border-white/[0.08] text-[11.5px] font-semibold text-zinc-300 hover:text-white px-3 h-8 rounded-lg shadow-lg"
          title="Auto-Arrange Nodes"
        >
          <ArrowsClockwise size={13} /> Layout
        </button>
        <button
          onClick={() => setFullscreen(!fullscreen)}
          className="bg-[#121215] border border-white/[0.08] text-zinc-300 hover:text-white p-2 rounded-lg shadow-lg flex items-center justify-center"
        >
          {fullscreen ? <ArrowsInSimple size={14} /> : <ArrowsOutSimple size={14} />}
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        onNodeDragStop={handleNodeDragStop}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2.0}
        proOptions={{ hideAttribution: true }}
        className="bg-[#09090b]"
        nodesConnectable={isOwner}
        nodesDraggable={isOwner}
        elementsSelectable={true}
      >
        <Background color="rgba(255,255,255,0.03)" gap={24} size={1} />
        <Controls 
          className="!bg-[#121215] !border-zinc-800 !rounded-lg !overflow-hidden fill-white" 
          style={{ border: '1px solid rgba(255,255,255,0.06)' }} 
        />
        <MiniMap 
          nodeColor="rgba(255,255,255,0.1)"
          maskColor="rgba(0,0,0,0.5)"
          className="!bg-[#121215] !border-zinc-800 !rounded-lg"
        />
      </ReactFlow>
    </div>
  )
}