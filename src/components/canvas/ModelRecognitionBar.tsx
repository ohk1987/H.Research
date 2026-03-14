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

export interface ModelRecognition {
  label: string
  processModel: string | null
  description: string
}

// PROCESS 모델 패턴 매칭
function detectProcessModel(nodes: Node[], edges: Edge[]): string | null {
  const normalEdges = edges.filter((e) => e.type !== "moderation")
  const moderationEdges = edges.filter((e) => e.type === "moderation")
  const hasMediation = detectMediation(nodes, normalEdges)
  const hasModerator = nodes.some((n) => n.type === "moderator") || moderationEdges.length > 0

  // Model 1: X → Y, W 조절 (단순 조절)
  if (!hasMediation && hasModerator && normalEdges.length === 1 && moderationEdges.length === 1) {
    return "Model 1"
  }

  // Model 7: X → M → Y, W가 X→M 경로 조절
  if (hasMediation && hasModerator) {
    // 조절변수가 첫 번째 경로(X→M)를 조절하는지 확인
    const mediationPath = findMediationPath(nodes, normalEdges)
    if (mediationPath && moderationEdges.length === 1) {
      const modTarget = moderationEdges[0].target
      // 조절이 매개변수로 향하면 Model 7
      if (modTarget === mediationPath.mediator) return "Model 7"
      // 조절이 종속변수로 향하면 Model 14
      if (modTarget === mediationPath.outcome) return "Model 14"
    }
  }

  // Model 14: X → M → Y, W가 M→Y 경로 조절
  // (위에서 이미 처리)

  // Model 58: X → M → Y, W가 X→M과 M→Y 모두 조절
  if (hasMediation && moderationEdges.length >= 2) {
    return "Model 58"
  }

  return null
}

// 모델 구조 자동 인식
function recognizeModel(nodes: Node[], edges: Edge[]): ModelRecognition {
  if (nodes.length === 0) {
    return { label: "캔버스에 변수를 배치하세요", processModel: null, description: "" }
  }

  const hasEdges = edges.length > 0
  const hasModeration = edges.some((e) => e.type === "moderation") || nodes.some((n) => n.type === "moderator")
  const hasLatent = nodes.some((n) => n.type === "latentVariable")
  const allObserved = nodes.every((n) => n.type === "observedVariable" || n.type === "moderator")
  const normalEdges = edges.filter((e) => e.type !== "moderation")

  if (!hasEdges) {
    return { label: "측정모형 분석 (CFA)", processModel: null, description: "경로를 연결하면 구조모형으로 전환됩니다" }
  }

  const hasMediation = detectMediation(nodes, normalEdges)
  const processModel = detectProcessModel(nodes, edges)

  // PROCESS 매크로 모형
  if (allObserved && (hasMediation || hasModeration)) {
    return {
      label: "PROCESS 매크로 모형",
      processModel,
      description: processModel
        ? `Hayes ${processModel} 패턴이 감지되었습니다`
        : "PROCESS 모형 패턴 분석 중",
    }
  }

  if (!hasLatent) {
    return { label: "구조방정식 모형 (CB-SEM)", processModel: null, description: "" }
  }

  if (hasMediation && hasModeration) {
    return {
      label: "CB-SEM + 조절된 매개 분석",
      processModel,
      description: processModel ? `Hayes ${processModel} 구조` : "조절 × 매개 효과 검증",
    }
  }
  if (hasModeration) {
    return { label: "CB-SEM + 조절효과 분석", processModel, description: "상호작용 효과 검증" }
  }
  if (hasMediation) {
    return { label: "CB-SEM + 매개효과 분석", processModel: null, description: "간접효과 검증 (부트스트랩)" }
  }

  return { label: "구조방정식 모형 (CB-SEM)", processModel: null, description: "" }
}

// A→B→C 패턴 감지
function detectMediation(nodes: Node[], edges: Edge[]): boolean {
  for (const edge1 of edges) {
    const mediator = edge1.target
    for (const edge2 of edges) {
      if (edge2.source === mediator && edge2.target !== edge1.source) {
        const nodeIds = new Set(nodes.map((n) => n.id))
        if (nodeIds.has(edge1.source) && nodeIds.has(mediator) && nodeIds.has(edge2.target)) {
          return true
        }
      }
    }
  }
  return false
}

// 매개 경로 찾기 (A→B→C 에서 A, B, C 반환)
function findMediationPath(
  nodes: Node[],
  edges: Edge[]
): { source: string; mediator: string; outcome: string } | null {
  for (const edge1 of edges) {
    const mediator = edge1.target
    for (const edge2 of edges) {
      if (edge2.source === mediator && edge2.target !== edge1.source) {
        const nodeIds = new Set(nodes.map((n) => n.id))
        if (nodeIds.has(edge1.source) && nodeIds.has(mediator) && nodeIds.has(edge2.target)) {
          return { source: edge1.source, mediator, outcome: edge2.target }
        }
      }
    }
  }
  return null
}

export default function ModelRecognitionBar({ nodes, edges }: ModelRecognitionBarProps) {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const recognition = useMemo(() => recognizeModel(nodes, edges), [nodes, edges])
  const canAnalyze = nodes.length > 0

  return (
    <div className="flex h-12 items-center justify-between border-t bg-muted/50 px-4">
      <div className="flex items-center gap-2">
        <Brain className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium text-[#1E2A3A]">{recognition.label}</span>
        {recognition.processModel && (
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
            {recognition.processModel}
          </span>
        )}
        {recognition.description && (
          <span className="text-xs text-slate-400">{recognition.description}</span>
        )}
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
