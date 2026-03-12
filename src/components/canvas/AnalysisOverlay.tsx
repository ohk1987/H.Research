"use client"

import type { Node, Edge } from "@xyflow/react"
import type { LatentVariableNodeData } from "./nodes/LatentVariableNode"
import type { CFAResult, SEMResult } from "@/lib/r-engine/analysis"

// CFA 결과를 노드에 적용
export function applyCFAResultToNodes(
  nodes: Node[],
  cfaResult: CFAResult
): Node[] {
  return nodes.map((node) => {
    if (node.type !== "latentVariable") return node
    const data = node.data as LatentVariableNodeData

    // AVE/CR 결과에서 해당 변수 찾기
    const aveCr = cfaResult.ave_cr?.find(
      (item: { variable: string; ave: number; cr: number }) => item.variable === data.label
    )

    // 해당 변수의 신뢰도 (표준화 요인적재량에서 계산)
    const loadings = cfaResult.parameters
      .filter((p) => p.op === "=~" && p.lhs === data.label)
      .map((p) => p["std.all"])

    const alpha = loadings.length > 0
      ? calculateAlphaFromLoadings(loadings)
      : null

    return {
      ...node,
      data: {
        ...data,
        alpha,
        ave: aveCr?.ave ?? null,
        cr: aveCr?.cr ?? null,
      },
    }
  })
}

// 표준화 요인적재량에서 α 근사값 계산
function calculateAlphaFromLoadings(loadings: number[]): number {
  const k = loadings.length
  const avgLoading = loadings.reduce((a, b) => a + b, 0) / k
  const alpha = (k * avgLoading ** 2) / (1 + (k - 1) * avgLoading ** 2)
  return Math.round(alpha * 1000) / 1000
}

// SEM 결과를 엣지에 적용 (경로계수 + 유의성 신호등)
export function applySEMResultToEdges(
  edges: Edge[],
  semResult: SEMResult,
  nodeDataMap: Map<string, LatentVariableNodeData>
): Edge[] {
  return edges.map((edge) => {
    if (edge.type === "moderation") return edge

    const sourceData = nodeDataMap.get(edge.source)
    const targetData = nodeDataMap.get(edge.target)
    if (!sourceData || !targetData) return edge

    // SEM 결과에서 해당 경로 찾기
    const param = semResult.parameters.find(
      (p) => p.op === "~" && p.lhs === targetData.label && p.rhs === sourceData.label
    )

    if (!param) return edge

    const beta = Math.round(param["std.all"] * 1000) / 1000
    const pvalue = param.pvalue

    // 유의성 신호등 색상
    let signalColor: string
    let signalLabel: string
    if (pvalue < 0.001) {
      signalColor = "#22c55e" // 초록
      signalLabel = "***"
    } else if (pvalue < 0.05) {
      signalColor = "#eab308" // 노랑
      signalLabel = "*"
    } else {
      signalColor = "#ef4444" // 빨강
      signalLabel = "n.s."
    }

    return {
      ...edge,
      label: `β=${beta}${signalLabel}`,
      labelStyle: { fontWeight: 600, fontSize: 11 },
      style: {
        ...edge.style,
        stroke: signalColor,
        strokeWidth: 2.5,
      },
      data: {
        ...edge.data,
        beta,
        pvalue,
        signalColor,
      },
    }
  })
}

// 모형적합도 요약 텍스트
export function formatFitMeasures(
  fitMeasures: Record<string, number>
): string {
  const cfi = fitMeasures.cfi?.toFixed(3) ?? "--"
  const tli = fitMeasures.tli?.toFixed(3) ?? "--"
  const rmsea = fitMeasures.rmsea?.toFixed(3) ?? "--"
  const srmr = fitMeasures.srmr?.toFixed(3) ?? "--"

  return `CFI=${cfi} | TLI=${tli} | RMSEA=${rmsea} | SRMR=${srmr}`
}

// 적합도 판정
export function evaluateFit(fitMeasures: Record<string, number>): {
  overall: 'good' | 'acceptable' | 'poor'
  details: { metric: string; value: number; status: 'good' | 'acceptable' | 'poor' }[]
} {
  const details = [
    {
      metric: 'CFI',
      value: fitMeasures.cfi ?? 0,
      status: fitMeasures.cfi >= 0.95 ? 'good' as const
        : fitMeasures.cfi >= 0.90 ? 'acceptable' as const
        : 'poor' as const,
    },
    {
      metric: 'TLI',
      value: fitMeasures.tli ?? 0,
      status: fitMeasures.tli >= 0.95 ? 'good' as const
        : fitMeasures.tli >= 0.90 ? 'acceptable' as const
        : 'poor' as const,
    },
    {
      metric: 'RMSEA',
      value: fitMeasures.rmsea ?? 1,
      status: fitMeasures.rmsea <= 0.05 ? 'good' as const
        : fitMeasures.rmsea <= 0.08 ? 'acceptable' as const
        : 'poor' as const,
    },
    {
      metric: 'SRMR',
      value: fitMeasures.srmr ?? 1,
      status: fitMeasures.srmr <= 0.05 ? 'good' as const
        : fitMeasures.srmr <= 0.08 ? 'acceptable' as const
        : 'poor' as const,
    },
  ]

  const poorCount = details.filter((d) => d.status === 'poor').length
  const overall = poorCount === 0 ? 'good' : poorCount <= 1 ? 'acceptable' : 'poor'

  return { overall, details }
}
