"use client"

import { memo } from "react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react"

export type ModerationEdgeData = {
  isModeration: boolean
}

type ModerationEdge = Edge<ModerationEdgeData, 'moderation'>

function ModerationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  selected,
}: EdgeProps<ModerationEdge>) {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: "#9333ea",
          strokeWidth: selected ? 2.5 : 2,
          strokeDasharray: "6 4",
        }}
        markerEnd="url(#moderation-arrow)"
      />
      <EdgeLabelRenderer>
        <div
          className="pointer-events-none absolute rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          조절
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export const ModerationEdgeMemo = memo(ModerationEdge)

// 화살표 마커 정의를 위한 SVG defs
export function EdgeMarkerDefs() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }}>
      <defs>
        <marker
          id="moderation-arrow"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
        >
          <path d="M2,2 L10,6 L2,10" fill="none" stroke="#9333ea" strokeWidth="1.5" />
        </marker>
      </defs>
    </svg>
  )
}
