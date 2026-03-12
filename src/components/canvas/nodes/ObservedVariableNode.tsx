"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"

export type ObservedVariableNodeData = {
  label: string
  columnName: string
}

type ObservedVariableNodeType = Node<ObservedVariableNodeData, 'observedVariable'>

function ObservedVariableNode({ data, selected }: NodeProps<ObservedVariableNodeType>) {
  return (
    <div
      className={`rounded-lg border-2 border-gray-300 bg-white px-4 py-3 shadow-sm transition-shadow ${
        selected ? "shadow-md ring-2 ring-primary/30" : ""
      }`}
      style={{ minWidth: 100 }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-white !bg-gray-400"
      />

      <span className="text-[10px] text-muted-foreground">관측변수</span>
      <p className="text-sm font-medium text-foreground">{data.label}</p>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-white !bg-gray-400"
      />
    </div>
  )
}

export default memo(ObservedVariableNode)
