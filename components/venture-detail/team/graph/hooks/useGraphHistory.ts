'use client'

import { useState, useCallback, useRef } from 'react'
import type { Node, Edge } from '@xyflow/react'

interface Snapshot {
  nodes: Node[]
  edges: Edge[]
  timestamp: number
  label: string
}

const MAX_HISTORY = 50

export function useGraphHistory() {
  const [past, setPast] = useState<Snapshot[]>([])
  const [future, setFuture] = useState<Snapshot[]>([])
  const isApplyingHistoryRef = useRef(false)

  const recordSnapshot = useCallback(
    (nodes: Node[], edges: Edge[], label: string) => {
      if (isApplyingHistoryRef.current) return
      setPast(prev => {
        const next = [...prev, { nodes, edges, timestamp: Date.now(), label }]
        return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next
      })
      setFuture([]) // clear redo on new action
    },
    []
  )

  const undo = useCallback(
    (current: { nodes: Node[]; edges: Edge[] }): Snapshot | null => {
      if (past.length === 0) return null
      const previous = past[past.length - 1]
      isApplyingHistoryRef.current = true
      setPast(prev => prev.slice(0, -1))
      setFuture(prev => [
        ...prev,
        { nodes: current.nodes, edges: current.edges, timestamp: Date.now(), label: 'current' }
      ])
      setTimeout(() => { isApplyingHistoryRef.current = false }, 0)
      return previous
    },
    [past]
  )

  const redo = useCallback(
    (current: { nodes: Node[]; edges: Edge[] }): Snapshot | null => {
      if (future.length === 0) return null
      const next = future[future.length - 1]
      isApplyingHistoryRef.current = true
      setFuture(prev => prev.slice(0, -1))
      setPast(prev => [
        ...prev,
        { nodes: current.nodes, edges: current.edges, timestamp: Date.now(), label: 'current' }
      ])
      setTimeout(() => { isApplyingHistoryRef.current = false }, 0)
      return next
    },
    [future]
  )

  const clear = useCallback(() => {
    setPast([])
    setFuture([])
  }, [])

  return {
    recordSnapshot,
    undo,
    redo,
    clear,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    historyDepth: past.length,
  }
}