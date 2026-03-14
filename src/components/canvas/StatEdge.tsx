"use client"

import { memo, useState } from "react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react"

export type StatEdgeData = {
  beta?: number
  se?: number
  pValue?: number
  analyzed?: boolean
}

type StatEdgeType = Edge<StatEdgeData, "stat">

function StatEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<StatEdgeType>) {
  const [hovered, setHovered] = useState(false)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const analyzed = data?.analyzed ?? false
  const beta = data?.beta
  const se = data?.se
  const pValue = data?.pValue

  // 스타일 결정
  let strokeColor = "#94a3b8" // 기본 회색
  let strokeDash = "6 4"
  let strokeWidth = selected ? 2.5 : 2
  let labelText = ""
  let labelBg = "bg-white"
  let labelColor = "text-slate-400"

  if (analyzed && beta !== undefined && pValue !== undefined) {
    strokeDash = "none"
    if (pValue < 0.01) {
      strokeColor = "#1E2A3A"
      labelBg = "bg-[#1E2A3A]"
      labelColor = "text-white"
      labelText = `${beta >= 0 ? "" : ""}${beta.toFixed(3)}**`
      strokeWidth = selected ? 3 : 2.5
    } else if (pValue < 0.05) {
      strokeColor = "#3b82f6"
      labelBg = "bg-blue-500"
      labelColor = "text-white"
      labelText = `${beta.toFixed(3)}*`
      strokeWidth = selected ? 3 : 2
    } else {
      // 비유의
      strokeColor = "#cbd5e1"
      strokeDash = "6 4"
      labelBg = "bg-slate-100"
      labelColor = "text-slate-400"
      labelText = `${beta.toFixed(3)}(ns)`
      strokeWidth = selected ? 2 : 1.5
    }
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: strokeDash,
        }}
        markerEnd={`url(#stat-arrow-${pValue !== undefined && pValue < 0.05 ? "sig" : "ns"})`}
      />
      <EdgeLabelRenderer>
        {/* 통계값 레이블 */}
        {analyzed && labelText && (
          <div
            className={`pointer-events-auto absolute cursor-pointer rounded-md px-2 py-0.5 text-[11px] font-semibold shadow-sm ${labelBg} ${labelColor}`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {labelText.startsWith("-") ? labelText : `β=${labelText}`}
          </div>
        )}

        {/* 호버 툴팁 */}
        {hovered && analyzed && beta !== undefined && se !== undefined && pValue !== undefined && (
          <div
            className="pointer-events-none absolute z-50 rounded-lg bg-[#1E2A3A] px-3 py-2 text-[11px] leading-relaxed text-white shadow-lg"
            style={{
              transform: `translate(-50%, -120%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <div>β = {beta.toFixed(3)}</div>
            <div>SE = {se.toFixed(3)}</div>
            <div>p = {pValue < 0.001 ? "<.001" : pValue.toFixed(3)}</div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}

export const StatEdgeMemo = memo(StatEdge)

// 화살표 마커
export function StatEdgeMarkerDefs() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }}>
      <defs>
        <marker
          id="stat-arrow-sig"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
        >
          <path d="M2,2 L10,6 L2,10" fill="none" stroke="#1E2A3A" strokeWidth="1.5" />
        </marker>
        <marker
          id="stat-arrow-ns"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
        >
          <path d="M2,2 L10,6 L2,10" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
        </marker>
      </defs>
    </svg>
  )
}
