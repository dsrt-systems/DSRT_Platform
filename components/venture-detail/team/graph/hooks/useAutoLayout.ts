'use client'

import { useCallback } from 'react'
import type { Node, Edge } from '@xyflow/react'

export type LayoutMode = 'hierarchy' | 'horizontal' | 'radial'

const NODE_WIDTH = 260
const NODE_HEIGHT = 180
const V_SPACING = 100
const H_SPACING = 80

export function useAutoLayout() {
  const applyHierarchy = useCallback((nodes: Node[], edges: Edge[]): Node[] => {
    // Build a tree from reports_to relationships
    const childrenMap: Record<string, string[]> = {}
    const parentMap: Record<string, string> = {}

    edges.forEach(e => {
      const type = (e.data as any)?.label
      if (type === 'reports_to' || type === 'belongs_to') {
        // source reports to target
        if (!childrenMap[e.target]) childrenMap[e.target] = []
        childrenMap[e.target].push(e.source)
        parentMap[e.source] = e.target
      }
    })

    // Find roots (nodes without parents)
    const roots = nodes.filter(n => !parentMap[n.id]).map(n => n.id)

    // Compute levels via BFS
    const levels: Record<string, number> = {}
    const queue: Array<{ id: string; level: number }> = roots.map(id => ({ id, level: 0 }))
    while (queue.length > 0) {
      const { id, level } = queue.shift()!
      if (levels[id] !== undefined) continue
      levels[id] = level
      const children = childrenMap[id] || []
      children.forEach(c => queue.push({ id: c, level: level + 1 }))
    }

    // Any orphaned nodes → level 0
    nodes.forEach(n => { if (levels[n.id] === undefined) levels[n.id] = 0 })

    // Group nodes by level
    const nodesByLevel: Record<number, string[]> = {}
    Object.entries(levels).forEach(([id, level]) => {
      if (!nodesByLevel[level]) nodesByLevel[level] = []
      nodesByLevel[level].push(id)
    })

    // Position nodes
    return nodes.map(n => {
      const level = levels[n.id]
      const indexInLevel = nodesByLevel[level].indexOf(n.id)
      const levelWidth = nodesByLevel[level].length * (NODE_WIDTH + H_SPACING)
      const startX = -levelWidth / 2 + (NODE_WIDTH + H_SPACING) / 2

      return {
        ...n,
        position: {
          x: startX + indexInLevel * (NODE_WIDTH + H_SPACING),
          y: level * (NODE_HEIGHT + V_SPACING)
        }
      }
    })
  }, [])

  const applyHorizontal = useCallback((nodes: Node[], edges: Edge[]): Node[] => {
    // Similar to hierarchy but rotated 90°
    const childrenMap: Record<string, string[]> = {}
    const parentMap: Record<string, string> = {}

    edges.forEach(e => {
      const type = (e.data as any)?.label
      if (type === 'reports_to' || type === 'belongs_to') {
        if (!childrenMap[e.target]) childrenMap[e.target] = []
        childrenMap[e.target].push(e.source)
        parentMap[e.source] = e.target
      }
    })

    const roots = nodes.filter(n => !parentMap[n.id]).map(n => n.id)
    const levels: Record<string, number> = {}
    const queue: Array<{ id: string; level: number }> = roots.map(id => ({ id, level: 0 }))
    while (queue.length > 0) {
      const { id, level } = queue.shift()!
      if (levels[id] !== undefined) continue
      levels[id] = level
      const children = childrenMap[id] || []
      children.forEach(c => queue.push({ id: c, level: level + 1 }))
    }
    nodes.forEach(n => { if (levels[n.id] === undefined) levels[n.id] = 0 })

    const nodesByLevel: Record<number, string[]> = {}
    Object.entries(levels).forEach(([id, level]) => {
      if (!nodesByLevel[level]) nodesByLevel[level] = []
      nodesByLevel[level].push(id)
    })

    return nodes.map(n => {
      const level = levels[n.id]
      const indexInLevel = nodesByLevel[level].indexOf(n.id)
      const levelHeight = nodesByLevel[level].length * (NODE_HEIGHT + V_SPACING)
      const startY = -levelHeight / 2 + (NODE_HEIGHT + V_SPACING) / 2

      return {
        ...n,
        position: {
          x: level * (NODE_WIDTH + H_SPACING * 2),
          y: startY + indexInLevel * (NODE_HEIGHT + V_SPACING)
        }
      }
    })
  }, [])

  const applyRadial = useCallback((nodes: Node[]): Node[] => {
    // Simple radial: first node at center, rest evenly distributed on ring
    if (nodes.length === 0) return nodes
    if (nodes.length === 1) {
      return [{ ...nodes[0], position: { x: 0, y: 0 } }]
    }

    const center = { ...nodes[0], position: { x: 0, y: 0 } }
    const others = nodes.slice(1)
    const radius = Math.max(300, others.length * 60)
    const angleStep = (2 * Math.PI) / others.length

    const positioned = others.map((n, i) => ({
      ...n,
      position: {
        x: Math.cos(i * angleStep - Math.PI / 2) * radius,
        y: Math.sin(i * angleStep - Math.PI / 2) * radius
      }
    }))

    return [center, ...positioned]
  }, [])

  const apply = useCallback(
    (mode: LayoutMode, nodes: Node[], edges: Edge[]): Node[] => {
      switch (mode) {
        case 'hierarchy': return applyHierarchy(nodes, edges)
        case 'horizontal': return applyHorizontal(nodes, edges)
        case 'radial': return applyRadial(nodes)
        default: return nodes
      }
    },
    [applyHierarchy, applyHorizontal, applyRadial]
  )

  return { apply }
}