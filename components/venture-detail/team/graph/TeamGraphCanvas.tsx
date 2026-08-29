'use client'

import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  Connection, Edge, Node, ReactFlowProvider,
  useReactFlow
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { toast } from 'sonner'

import { PersonNode } from './nodes/PersonNode'
import { OpenPositionNode } from './nodes/OpenPositionNode'
import { TeamGroupNode } from './nodes/TeamGroupNode'
import { RelationshipEdge } from './edges/RelationshipEdge'
import { EdgeTypeModal } from './modals/EdgeTypeModal'
import { EdgeEditModal } from './modals/EdgeEditModal'
import { GraphToolbar } from './GraphToolbar'
import { useGraphHistory } from './hooks/useGraphHistory'
import { useAutoLayout, type LayoutMode } from './hooks/useAutoLayout'
import { useLayoutPersistence } from './hooks/useLayoutPersistence'
import type { RelationshipType, NodeData } from './types'

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
  person: PersonNode,
  open_position: OpenPositionNode,
  team_group: TeamGroupNode,
}

const edgeTypes = {
  relationship: RelationshipEdge,
}

export function TeamGraphCanvas({ slug, data, isOwner, onNodeSelect, onRefresh }: Props) {
  return (
    <ReactFlowProvider>
      <CanvasCore
        slug={slug}
        data={data}
        isOwner={isOwner}
        onNodeSelect={onNodeSelect}
        onRefresh={onRefresh}
      />
    </ReactFlowProvider>
  )
}

function CanvasCore({ slug, data, isOwner, onNodeSelect, onRefresh }: Props) {
  const { fitView } = useReactFlow()
  const [fullscreen, setFullscreen] = useState(false)

  // Modal states
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null)
  const [editingEdge, setEditingEdge] = useState<{ id: string; type: RelationshipType } | null>(null)

  // Hooks
  const history = useGraphHistory()
  const autoLayout = useAutoLayout()
  const { saveLayout } = useLayoutPersistence(slug)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Prevent double-fitting on mount
  const hasFittedView = useRef(false)

  // Master Sync: Rebuild nodes and edges ONLY when stringified data changes
  // This physically prevents infinite render loops
  const dataString = JSON.stringify({
    posCount: data?.positions?.length || 0,
    relCount: data?.relationships?.length || 0,
    memCount: data?.memberships?.length || 0,
  })

  useEffect(() => {
    if (!data || !data.positions) return

    const newNodes: Node[] = data.positions.map((pos: any, index: number) => {
      const occupants = data.memberships.filter((m: any) => m.position_id === pos.id && m.status === 'active')
      const layout = data.layout.find((l: any) => l.position_id === pos.id)

      let nodeType: string = 'open_position'
      if (pos.position_type === 'team_group' || pos.position_type === 'department') {
        nodeType = 'team_group'
      } else if (occupants.length > 0) {
        nodeType = 'person'
      }

      const defaultX = 100 + (index * 20)
      const defaultY = 100 + (index * 20)

      return {
        id: pos.id,
        type: nodeType,
        position: {
          x: layout ? parseFloat(layout.x) : defaultX,
          y: layout ? parseFloat(layout.y) : defaultY
        },
        data: { position: pos, occupants, isOwner }
      }
    })

    const newEdges: Edge[] = data.relationships.map((rel: any) => ({
      id: rel.id,
      source: rel.source_position_id,
      target: rel.target_position_id,
      type: 'relationship',
      data: {
        label: rel.relationship_type || 'reports_to',
        isOwner,
        onEdit: (edgeId: string) => {
          setEditingEdge({ id: edgeId, type: rel.relationship_type as RelationshipType })
        }
      }
    }))

    setNodes(newNodes)
    setEdges(newEdges)
    history.clear()
    
    if (newNodes.length > 0 && !hasFittedView.current) {
      hasFittedView.current = true
      setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataString, isOwner, setNodes, setEdges]) // Only re-run when counts change

  const onSelectionChange = useCallback(({ nodes: selNodes }: { nodes: Node[] }) => {
    onNodeSelect(selNodes.length === 1 ? selNodes[0].id : null)
  }, [onNodeSelect])

  const handleNodeDragStop = useCallback(() => {
    if (!isOwner) return
    saveLayout(nodes)
  }, [isOwner, nodes, saveLayout])

  const handleConnect = useCallback((connection: Connection) => {
    if (!isOwner) return
    setPendingConnection(connection)
  }, [isOwner])

  const handleConfirmConnection = useCallback(async (type: RelationshipType) => {
    if (!pendingConnection) return
    try {
      const res = await fetch(`/api/ventures/${slug}/team/relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_position_id: pendingConnection.source,
          target_position_id: pendingConnection.target,
          relationship_type: type
        })
      })
      if (!res.ok) throw new Error()
      toast.success('Relationship created')
      onRefresh()
    } catch {
      toast.error('Could not create relationship')
    } finally {
      setPendingConnection(null)
    }
  }, [pendingConnection, slug, onRefresh])

  const handleEdgeUpdate = useCallback(async (newType: RelationshipType) => {
    if (!editingEdge) return
    try {
      const res = await fetch(`/api/ventures/${slug}/team/relationships/${editingEdge.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationship_type: newType })
      })
      if (!res.ok) throw new Error()
      toast.success('Relationship updated')
      onRefresh()
    } catch {
      toast.error('Could not update relationship')
    } finally {
      setEditingEdge(null)
    }
  }, [editingEdge, slug, onRefresh])

  const handleEdgeDelete = useCallback(async () => {
    if (!editingEdge) return
    try {
      const res = await fetch(`/api/ventures/${slug}/team/relationships/${editingEdge.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error()
      toast.success('Relationship removed')
      onRefresh()
    } catch {
      toast.error('Could not remove relationship')
    } finally {
      setEditingEdge(null)
    }
  }, [editingEdge, slug, onRefresh])

  const handleAutoLayout = useCallback((mode: LayoutMode) => {
    history.recordSnapshot(nodes, edges, `auto-layout:${mode}`)
    const newNodes = autoLayout.apply(mode, nodes, edges)
    setNodes(newNodes)
    saveLayout(newNodes, true)
    setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100)
    toast.success(`Applied ${mode} layout`)
  }, [autoLayout, nodes, edges, setNodes, saveLayout, fitView, history])

  const handleUndo = useCallback(() => {
    const snapshot = history.undo({ nodes, edges })
    if (snapshot) {
      setNodes(snapshot.nodes)
      setEdges(snapshot.edges)
      saveLayout(snapshot.nodes, true)
      toast('Undo', { icon: '↶' })
    }
  }, [history, nodes, edges, setNodes, setEdges, saveLayout])

  const handleRedo = useCallback(() => {
    const snapshot = history.redo({ nodes, edges })
    if (snapshot) {
      setNodes(snapshot.nodes)
      setEdges(snapshot.edges)
      saveLayout(snapshot.nodes, true)
      toast('Redo', { icon: '↷' })
    }
  }, [history, nodes, edges, setNodes, setEdges, saveLayout])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (target.isContentEditable) return

      if (isOwner && (e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
        return
      }
      if (isOwner && (e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
        return
      }

      if (e.key === 'f' && !e.metaKey && !e.ctrlKey) {
        fitView({ duration: 400, padding: 0.2 })
        return
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const selectedNode = nodes.find(n => n.selected)
        if (!selectedNode) return

        const target = findNearestNode(selectedNode, nodes, e.key)
        if (target) {
          e.preventDefault()
          setNodes(nds => nds.map(n => ({ ...n, selected: n.id === target.id })))
          onNodeSelect(target.id)
        }
      }

      if (e.key === 'Escape') {
        setNodes(nds => nds.map(n => ({ ...n, selected: false })))
        onNodeSelect(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOwner, nodes, handleUndo, handleRedo, fitView, setNodes, onNodeSelect])

  const containerClass = fullscreen
    ? 'fixed inset-0 z-[100] bg-[#09090b]'
    : 'relative w-full h-full'

  const sourceNode = nodes.find(n => n.id === pendingConnection?.source)
  const targetNode = nodes.find(n => n.id === pendingConnection?.target)

  return (
    <div className={containerClass}>
      <GraphToolbar
        isOwner={isOwner}
        fullscreen={fullscreen}
        onToggleFullscreen={() => setFullscreen(f => !f)}
        onAutoLayout={handleAutoLayout}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onFitView={() => fitView({ duration: 400, padding: 0.2 })}
      />

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center">
            <p className="text-[14px] font-bold text-white mb-1">No positions yet</p>
            <p className="text-[12px] text-zinc-500">
              {isOwner ? 'Click "Add Position" to build your team structure' : 'The team has not published positions yet'}
            </p>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        onNodeDragStop={handleNodeDragStop}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.15}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-[#09090b]"
        nodesConnectable={isOwner}
        nodesDraggable={isOwner}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        panOnDrag={true}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        preventScrolling={true}
      >
        <Background
          color="rgba(255,255,255,0.05)"
          gap={32}
          size={1}
          style={{ backgroundColor: '#09090b' }}
        />
        <Controls
          className="!bg-[#121215] !border !border-white/[0.08] !rounded-lg !overflow-hidden !shadow-lg"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'person') return '#60a5fa'
            if (n.type === 'open_position') return '#71717a'
            if (n.type === 'team_group') return '#a78bfa'
            return '#71717a'
          }}
          maskColor="rgba(9,9,11,0.85)"
          className="!bg-[#0d0d10] !border !border-white/[0.06] !rounded-lg !overflow-hidden"
          pannable
          zoomable
        />
      </ReactFlow>

      <EdgeTypeModal
        open={!!pendingConnection}
        onClose={() => setPendingConnection(null)}
        onConfirm={handleConfirmConnection}
        sourceLabel={(sourceNode?.data as unknown as NodeData)?.position?.title || 'Source'}
        targetLabel={(targetNode?.data as unknown as NodeData)?.position?.title || 'Target'}
      />

      <EdgeEditModal
        open={!!editingEdge}
        onClose={() => setEditingEdge(null)}
        currentType={editingEdge?.type || 'reports_to'}
        onUpdate={handleEdgeUpdate}
        onDelete={handleEdgeDelete}
      />
    </div>
  )
}

function findNearestNode(current: Node, all: Node[], direction: string): Node | null {
  const others = all.filter(n => n.id !== current.id)
  if (others.length === 0) return null

  const cx = current.position.x
  const cy = current.position.y

  const candidates = others.filter(n => {
    const dx = n.position.x - cx
    const dy = n.position.y - cy
    switch (direction) {
      case 'ArrowUp': return dy < -50
      case 'ArrowDown': return dy > 50
      case 'ArrowLeft': return dx < -50
      case 'ArrowRight': return dx > 50
      default: return false
    }
  })

  if (candidates.length === 0) return null

  candidates.sort((a, b) => {
    const da = Math.hypot(a.position.x - cx, a.position.y - cy)
    const db = Math.hypot(b.position.x - cx, b.position.y - cy)
    return da - db
  })

  return candidates[0]
}