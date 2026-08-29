'use client'

import React from 'react'
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react'

interface RelationshipEdgeData {
  label?: string
  isOwner?: boolean
  onDeleteEdge?: (id: string) => void
}

export function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  })

  const edgeData = (data as unknown as RelationshipEdgeData) || {}
  const labelText = edgeData.label ? String(edgeData.label).replace('_', ' ') : ''

  return (
    <>
      <path
        id={id}
        style={{ ...style, strokeWidth: 2, stroke: '#27272a' }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {labelText ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan px-2 py-0.5 rounded-full bg-[#121215] border border-white/[0.08] text-[9.5px] font-mono text-zinc-400 shadow-lg capitalize flex items-center gap-1"
          >
            {labelText}
            {Boolean(edgeData.isOwner) && Boolean(edgeData.onDeleteEdge) && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (typeof edgeData.onDeleteEdge === 'function') {
                    edgeData.onDeleteEdge(id)
                  }
                }}
                className="w-3.5 h-3.5 rounded bg-zinc-800 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors font-sans text-[8px] font-bold"
              >
                ×
              </button>
            )}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}