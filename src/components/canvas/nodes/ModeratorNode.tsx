"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"

export type ModeratorNodeData = {
  label: string
  variableId: string
  itemCount: number
  alpha: number | null
}

type ModeratorNodeType = Node<ModeratorNodeData, "moderator">

function ModeratorNode({ data, selected }: NodeProps<ModeratorNodeType>) {
  return (
    <div
      className={`relative flex flex-col items-center transition-shadow ${
        selected ? "drop-shadow-lg" : "drop-shadow-sm"
      }`}
      style={{ minWidth: 120 }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-white !bg-amber-400"
      />

      {/* 육각형 (CSS clip-path) */}
      <div
        className={`flex flex-col items-center justify-center bg-amber-50 px-6 py-4 ${
          selected ? "ring-2 ring-amber-400/50" : ""
        }`}
        style={{
          clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
          minWidth: 130,
          minHeight: 80,
          border: "2px solid #f59e0b",
        }}
      >
        <span className="text-[10px] font-semibold text-amber-600">조절변수</span>
        <span className="mt-0.5 text-sm font-semibold text-[#1E2A3A]">{data.label}</span>
        {data.itemCount > 0 && (
          <span className="mt-0.5 text-[10px] text-amber-500">
            {data.itemCount}개 문항
          </span>
        )}
      </div>
      {/* 육각형 테두리 (SVG 오버레이) */}
      <svg
        className="pointer-events-none absolute inset-0"
        viewBox="0 0 130 80"
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%" }}
      >
        <polygon
          points="32.5,0 97.5,0 130,40 97.5,80 32.5,80 0,40"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
        />
      </svg>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-white !bg-amber-400"
      />
    </div>
  )
}

export default memo(ModeratorNode)
