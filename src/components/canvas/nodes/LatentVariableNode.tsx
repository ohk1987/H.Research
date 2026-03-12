"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { AlertTriangle } from "lucide-react"
import type { VariableColor } from "@/types/variables"

export type LatentVariableNodeData = {
  label: string
  color: VariableColor
  itemCount: number
  alpha: number | null
  ave: number | null
  cr: number | null
  variableId: string
}

type LatentVariableNodeType = Node<LatentVariableNodeData, 'latentVariable'>

const COLOR_STYLES: Record<VariableColor, { border: string; bg: string; text: string }> = {
  blue: { border: "border-blue-400", bg: "bg-blue-50", text: "text-blue-700" },
  green: { border: "border-green-400", bg: "bg-green-50", text: "text-green-700" },
  yellow: { border: "border-yellow-400", bg: "bg-yellow-50", text: "text-yellow-700" },
  purple: { border: "border-purple-400", bg: "bg-purple-50", text: "text-purple-700" },
}

const COLOR_LABELS: Record<VariableColor, string> = {
  blue: "독립",
  green: "종속",
  yellow: "매개",
  purple: "조절",
}

function LatentVariableNode({ data, selected }: NodeProps<LatentVariableNodeType>) {
  const style = COLOR_STYLES[data.color]

  // 기준 미달 경고
  const alphaWarning = data.alpha !== null && data.alpha < 0.7
  const aveWarning = data.ave !== null && data.ave < 0.5

  return (
    <div
      className={`relative flex flex-col items-center rounded-[50%/40%] border-2 px-6 py-4 shadow-sm transition-shadow ${style.border} ${style.bg} ${
        selected ? "shadow-md ring-2 ring-primary/30" : ""
      }`}
      style={{ minWidth: 140 }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-white !bg-gray-400"
      />

      {/* 경고 아이콘 */}
      {(alphaWarning || aveWarning) && (
        <div className="absolute -right-1 -top-1" title={
          alphaWarning && aveWarning
            ? "α < .70, AVE < .50"
            : alphaWarning ? "α < .70" : "AVE < .50"
        }>
          <AlertTriangle className="size-4 text-orange-500" />
        </div>
      )}

      <span className={`text-[10px] font-medium ${style.text}`}>
        {COLOR_LABELS[data.color]}
      </span>
      <span className="mt-0.5 text-sm font-semibold text-foreground">
        {data.label}
      </span>
      <span className="mt-1 text-xs text-muted-foreground">
        문항 {data.itemCount}개
      </span>
      <div className="mt-0.5 flex gap-2 text-xs font-mono text-muted-foreground">
        <span className={alphaWarning ? "text-orange-600 font-semibold" : ""}>
          α={data.alpha !== null ? data.alpha.toFixed(3) : "--"}
        </span>
        {data.ave !== null && (
          <span className={aveWarning ? "text-orange-600 font-semibold" : ""}>
            AVE={data.ave.toFixed(3)}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-white !bg-gray-400"
      />
    </div>
  )
}

export default memo(LatentVariableNode)
