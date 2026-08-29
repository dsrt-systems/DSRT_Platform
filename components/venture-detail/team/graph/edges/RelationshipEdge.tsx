'use client'

import { memo } from 'react'
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react'
import { RELATIONSHIP_TYPES, type RelationshipType, type EdgeData } from '../types'

export const RelationshipEdge = memo((props: EdgeProps) => {
  const {
    id, sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition, style = {}, markerEnd, data
  } = props

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition, targetPosition, targetX, targetY,
    borderRadius: 12
  })

  const edgeData = (data as unknown as EdgeData) || { label: 'reports_to', isOwner: false }
  const config = RELATIONSHIP_TYPES.find(r => r.value === edgeData.label)
  const color = config?.color || '#71717a'
  const label = config?.label || edgeData.label

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: color,
          strokeWidth: 1.5,
          strokeOpacity: 0.6,
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            onClick={() => edgeData.onEdit?.(id)}
            disabled={!edgeData.isOwner}
            className={
              'px-2 py-0.5 rounded-full text-[9.5px] font-mono uppercase tracking-wider font-bold bg-[#121215] border shadow-lg transition-all ' +
              (edgeData.isOwner
                ? 'text-zinc-300 hover:text-white cursor-pointer hover:scale-105'
                : 'text-zinc-500 cursor-default')
            }
            style={{
              borderColor: `${color}40`,
              color: edgeData.isOwner ? undefined : color
            }}
          >
            {label}
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
})

RelationshipEdge.displayName = 'RelationshipEdge'