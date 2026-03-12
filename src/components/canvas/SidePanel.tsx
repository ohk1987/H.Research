"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useProjectStore } from "@/lib/store/project-store"
import type { Node, Edge } from "@xyflow/react"
import type { LatentVariableNodeData } from "./nodes/LatentVariableNode"

interface SidePanelProps {
  selectedNode: Node | null
  selectedEdge: Edge | null
  nodes: Node[]
  edges: Edge[]
  onToggleEdgeType: (edgeId: string) => void
}

export default function SidePanel({
  selectedNode,
  selectedEdge,
  nodes,
  edges,
  onToggleEdgeType,
}: SidePanelProps) {
  const latentVariables = useProjectStore((s) => s.latentVariables)

  // 선택 없음
  if (!selectedNode && !selectedEdge) {
    return (
      <div className="flex h-full w-70 flex-col border-l bg-muted/30">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">모델 정보</h3>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="text-sm text-muted-foreground">모델을 구성하세요</p>
          <p className="mt-2 text-xs text-muted-foreground">
            캔버스에서 노드나 경로를 선택하면
            <br />
            상세 정보가 표시됩니다
          </p>
          <div className="mt-6 flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold">{nodes.length}</p>
              <p className="text-xs text-muted-foreground">노드</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{edges.length}</p>
              <p className="text-xs text-muted-foreground">경로</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 엣지 선택
  if (selectedEdge) {
    const sourceNode = nodes.find((n) => n.id === selectedEdge.source)
    const targetNode = nodes.find((n) => n.id === selectedEdge.target)
    const isModeration = selectedEdge.type === "moderation"

    return (
      <div className="flex h-full w-70 flex-col border-l bg-muted/30">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">경로 정보</h3>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <div>
            <p className="text-xs text-muted-foreground">연결</p>
            <p className="mt-1 text-sm font-medium">
              {(sourceNode?.data as LatentVariableNodeData)?.label ?? sourceNode?.id}
              {" → "}
              {(targetNode?.data as LatentVariableNodeData)?.label ?? targetNode?.id}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">경로 유형</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={isModeration ? "secondary" : "default"}>
                {isModeration ? "조절 경로" : "일반 경로"}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleEdgeType(selectedEdge.id)}
          >
            {isModeration ? "일반 경로로 변경" : "조절 경로로 변경"}
          </Button>
        </div>
      </div>
    )
  }

  // 노드 선택
  if (selectedNode && selectedNode.type === "latentVariable") {
    const nodeData = selectedNode.data as LatentVariableNodeData
    const variable = latentVariables.find((v) => v.id === nodeData.variableId)

    return (
      <div className="flex h-full w-70 flex-col border-l bg-muted/30">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">잠재변수 정보</h3>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <div>
            <p className="text-xs text-muted-foreground">변수명</p>
            <p className="mt-1 text-sm font-semibold">{nodeData.label}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">할당 문항</p>
            {variable ? (
              <div className="mt-1 flex flex-col gap-1">
                {variable.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <span className="truncate">{item.columnName}</span>
                    {item.isReversed && (
                      <Badge variant="outline" className="h-4 px-1 text-[9px] text-orange-600">
                        R
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                문항 {nodeData.itemCount}개
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">신뢰도 (Cronbach&apos;s α)</p>
            <p className="mt-1 font-mono text-sm">
              {nodeData.alpha !== null ? nodeData.alpha.toFixed(3) : "미분석"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 관측변수 노드
  return (
    <div className="flex h-full w-70 flex-col border-l bg-muted/30">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">관측변수 정보</h3>
      </div>
      <div className="p-4">
        <p className="text-xs text-muted-foreground">변수명</p>
        <p className="mt-1 text-sm font-semibold">
          {(selectedNode?.data as { label?: string })?.label ?? "--"}
        </p>
      </div>
    </div>
  )
}
