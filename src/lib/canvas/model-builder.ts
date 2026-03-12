import type { Edge } from '@xyflow/react'
import type { LatentVariable } from '@/types/variables'
import type { LatentVariableNodeData } from '@/components/canvas/nodes/LatentVariableNode'

// CFA 모델 문법 생성
// 출력 예: 직무만족 =~ q1 + q2 + q3
export function buildCFAModel(latentVariables: LatentVariable[]): string {
  return latentVariables
    .filter((v) => v.items.length > 0)
    .map((v) => {
      const items = v.items.map((i) => i.columnName).join(' + ')
      return `${v.name} =~ ${items}`
    })
    .join('\n')
}

// SEM 모델 문법 생성 (측정모형 + 구조모형)
export function buildSEMModel(
  latentVariables: LatentVariable[],
  edges: Edge[],
  nodeDataMap: Map<string, LatentVariableNodeData>
): string {
  // 측정모형 부분
  const measurement = buildCFAModel(latentVariables)

  // 구조모형 부분: 엣지에서 경로 추출
  const structural = edges
    .filter((e) => e.type !== 'moderation')
    .map((e) => {
      const sourceData = nodeDataMap.get(e.source)
      const targetData = nodeDataMap.get(e.target)
      if (!sourceData || !targetData) return null
      return `${targetData.label} ~ ${sourceData.label}`
    })
    .filter(Boolean)
    .join('\n')

  // 조절효과 (상호작용항)
  const moderation = edges
    .filter((e) => e.type === 'moderation')
    .map((e) => {
      const sourceData = nodeDataMap.get(e.source)
      const targetData = nodeDataMap.get(e.target)
      if (!sourceData || !targetData) return null
      return `# 조절효과: ${sourceData.label} → ${targetData.label}`
    })
    .filter(Boolean)
    .join('\n')

  return [measurement, structural, moderation].filter(Boolean).join('\n\n')
}

// 매개분석 모델 문법 생성
export function buildMediationModel(
  latentVariables: LatentVariable[],
  edges: Edge[],
  nodeDataMap: Map<string, LatentVariableNodeData>,
  mediatorNodeId: string
): string {
  const measurement = buildCFAModel(latentVariables)

  const mediatorData = nodeDataMap.get(mediatorNodeId)
  if (!mediatorData) return measurement

  // A→M, M→Y, A→Y 경로 추출
  const normalEdges = edges.filter((e) => e.type !== 'moderation')

  const paths = normalEdges
    .map((e) => {
      const sourceData = nodeDataMap.get(e.source)
      const targetData = nodeDataMap.get(e.target)
      if (!sourceData || !targetData) return null

      // 경로 라벨링
      let label = ''
      if (e.target === mediatorNodeId) label = 'a'
      else if (e.source === mediatorNodeId) label = 'b'
      else label = 'c'

      return `${targetData.label} ~ ${label}*${sourceData.label}`
    })
    .filter(Boolean)
    .join('\n')

  // 간접효과 정의
  const indirect = 'indirect := a*b\ntotal := c + a*b'

  return [measurement, paths, indirect].filter(Boolean).join('\n\n')
}

// 조절효과 모델 문법 생성
export function buildModerationModel(
  latentVariables: LatentVariable[],
  edges: Edge[],
  nodeDataMap: Map<string, LatentVariableNodeData>,
  moderatorNodeId: string
): string {
  const measurement = buildCFAModel(latentVariables)

  const moderatorData = nodeDataMap.get(moderatorNodeId)
  if (!moderatorData) return measurement

  const normalEdges = edges.filter((e) => e.type !== 'moderation')
  const moderationEdges = edges.filter((e) => e.type === 'moderation')

  const paths = normalEdges
    .map((e) => {
      const sourceData = nodeDataMap.get(e.source)
      const targetData = nodeDataMap.get(e.target)
      if (!sourceData || !targetData) return null
      return `${targetData.label} ~ ${sourceData.label}`
    })
    .filter(Boolean)
    .join('\n')

  // 조절효과 (상호작용항에 대한 설명 주석)
  const modComment = moderationEdges
    .map((e) => {
      const sourceData = nodeDataMap.get(e.source)
      const targetData = nodeDataMap.get(e.target)
      if (!sourceData || !targetData) return null
      return `# 조절: ${moderatorData.label} × ${sourceData.label} → ${targetData.label}`
    })
    .filter(Boolean)
    .join('\n')

  return [measurement, paths, modComment].filter(Boolean).join('\n\n')
}
