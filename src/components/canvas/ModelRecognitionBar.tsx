"use client"

import { useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight, Brain } from "lucide-react"
import type { Node, Edge } from "@xyflow/react"

interface ModelRecognitionBarProps {
  nodes: Node[]
  edges: Edge[]
}

// 모델 구조 자동 인식
function recognizeModel(nodes: Node[], edges: Edge[]): string {
  if (nodes.length === 0) return "캔버스에 잠재변수를 배치하세요"

  const hasEdges = edges.length > 0
  const hasModeration = edges.some((e) => e.type === "moderation")
  const hasLatent = nodes.some((n) => n.type === "latentVariable")
  const allObserved = nodes.every((n) => n.type === "observedVariable")

  if (!hasEdges) return "측정모형 분석 (CFA)"

  // 매개 경로 감지: A→B→C 패턴
  const hasMediation = detectMediation(nodes, edges)

  if (allObserved && hasMediation && hasModeration) return "PROCESS 매크로 모형"
  if (allObserved && (hasMediation || hasModeration)) return "PROCESS 매크로 모형"

  if (!hasLatent) return "구조방정식 모형 (CB-SEM)"

  if (hasMediation && hasModeration) return "CB-SEM + 조절된 매개 분석"
  if (hasModeration) return "CB-SEM + 조절효과 분석"
  if (hasMediation) return "CB-SEM + 매개효과 분석"

  return "구조방정식 모형 (CB-SEM)"
}

// A→B→C 패턴 감지
function detectMediation(nodes: Node[], edges: Edge[]): boolean {
  const normalEdges = edges.filter((e) => e.type !== "moderation")

  for (const edge1 of normalEdges) {
    const mediator = edge1.target
    for (const edge2 of normalEdges) {
      if (edge2.source === mediator && edge2.target !== edge1.source) {
        // A→B, B→C 그리고 A→C 직접경로도 있는지 확인 (부분매개)
        // 또는 단순 A→B→C (완전매개)
        const nodeIds = new Set(nodes.map((n) => n.id))
        if (nodeIds.has(edge1.source) && nodeIds.has(mediator) && nodeIds.has(edge2.target)) {
          return true
        }
      }
    }
  }
  return false
}

export default function ModelRecognitionBar({ nodes, edges }: ModelRecognitionBarProps) {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const modelType = useMemo(() => recognizeModel(nodes, edges), [nodes, edges])
  const canAnalyze = nodes.length > 0

  return (
    <div className="flex h-12 items-center justify-between border-t bg-muted/50 px-4">
      <div className="flex items-center gap-2">
        <Brain className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">{modelType}</span>
      </div>
      <Button
        size="sm"
        disabled={!canAnalyze}
        onClick={() => router.push(`/projects/${projectId}/analysis`)}
      >
        1단계 분석 시작
        <ArrowRight className="size-4" />
      </Button>
    </div>
  )
}
