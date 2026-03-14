"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip } from "@/components/ui/tooltip"
import { useProjectStore } from "@/lib/store/project-store"
import type { Node, Edge } from "@xyflow/react"
import type { LatentVariableNodeData } from "./nodes/LatentVariableNode"
import type { ModeratorNodeData } from "./nodes/ModeratorNode"
import type { AnalysisOptions } from "@/types/analysis"

interface SidePanelProps {
  selectedNode: Node | null
  selectedEdge: Edge | null
  nodes: Node[]
  edges: Edge[]
  onToggleEdgeType: (edgeId: string) => void
  analysisOptions: AnalysisOptions
  onOptionsChange: (opts: Partial<AnalysisOptions>) => void
}

export default function SidePanel({
  selectedNode,
  selectedEdge,
  nodes,
  edges,
  onToggleEdgeType,
  analysisOptions,
  onOptionsChange,
}: SidePanelProps) {
  const latentVariables = useProjectStore((s) => s.latentVariables)

  return (
    <div className="flex h-full w-64 flex-col border-l border-slate-200 bg-white">
      {/* 상단: 노드/엣지 정보 */}
      <div className="flex-1 overflow-y-auto">
        {!selectedNode && !selectedEdge ? (
          <DefaultInfo nodes={nodes} edges={edges} />
        ) : selectedEdge ? (
          <EdgeInfo
            edge={selectedEdge}
            nodes={nodes}
            onToggleEdgeType={onToggleEdgeType}
          />
        ) : selectedNode?.type === "latentVariable" ? (
          <LatentInfo node={selectedNode} latentVariables={latentVariables} />
        ) : selectedNode?.type === "moderator" ? (
          <ModeratorInfo node={selectedNode} />
        ) : (
          <ObservedInfo node={selectedNode} />
        )}
      </div>

      {/* 하단: 분석 옵션 */}
      <div className="border-t border-slate-200">
        <div className="px-4 py-3">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            분석 옵션
          </h4>

          {/* 추정 방법 */}
          <div className="mb-3">
            <div className="mb-1 flex items-center gap-1">
              <label className="text-xs font-medium text-[#1E2A3A]">추정 방법</label>
              <Tooltip content="ML: 최대우도법 (연속형 기본). WLSMV: 서열형/이분형 데이터. MLR: 비정규 데이터에 강건." />
            </div>
            <select
              value={analysisOptions.estimator}
              onChange={(e) => onOptionsChange({ estimator: e.target.value as AnalysisOptions["estimator"] })}
              className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-[#1E2A3A]"
            >
              <option value="ML">ML (최대우도법)</option>
              <option value="WLSMV">WLSMV</option>
              <option value="MLR">MLR</option>
            </select>
          </div>

          {/* 부트스트랩 */}
          <div className="mb-3">
            <div className="mb-1 flex items-center gap-1">
              <label className="text-xs font-medium text-[#1E2A3A]">부트스트랩</label>
              <Tooltip content="매개효과 검증 시 반복 수. KCI 논문 기준 5,000회 권장." />
            </div>
            <select
              value={analysisOptions.bootstrap}
              onChange={(e) => onOptionsChange({ bootstrap: Number(e.target.value) as AnalysisOptions["bootstrap"] })}
              className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-[#1E2A3A]"
            >
              <option value={1000}>1,000회</option>
              <option value={5000}>5,000회 (권장)</option>
              <option value={10000}>10,000회</option>
            </select>
          </div>

          {/* 신뢰구간 */}
          <div className="mb-3">
            <div className="mb-1 flex items-center gap-1">
              <label className="text-xs font-medium text-[#1E2A3A]">신뢰구간</label>
              <Tooltip content="사회과학 기본: 95%. 보수적 분석: 99%." />
            </div>
            <select
              value={analysisOptions.confidenceInterval}
              onChange={(e) => onOptionsChange({ confidenceInterval: Number(e.target.value) as AnalysisOptions["confidenceInterval"] })}
              className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-[#1E2A3A]"
            >
              <option value={90}>90%</option>
              <option value={95}>95% (기본)</option>
              <option value={99}>99%</option>
            </select>
          </div>

          {/* 결측치 처리 */}
          <div>
            <div className="mb-1 flex items-center gap-1">
              <label className="text-xs font-medium text-[#1E2A3A]">결측치 처리</label>
              <Tooltip content="FIML: SEM 권장 방식 (모든 데이터 활용). 목록별 삭제: 결측 행 제외." />
            </div>
            <select
              value={analysisOptions.missingData}
              onChange={(e) => onOptionsChange({ missingData: e.target.value as AnalysisOptions["missingData"] })}
              className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-[#1E2A3A]"
            >
              <option value="fiml">FIML (권장)</option>
              <option value="listwise">목록별 삭제</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 하위 정보 컴포넌트 ───

function DefaultInfo({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  return (
    <div className="p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">모델 정보</h3>
      <div className="flex flex-col items-center py-6 text-center">
        <p className="text-sm text-slate-500">노드나 경로를 선택하세요</p>
        <div className="mt-4 flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#1E2A3A]">{nodes.length}</p>
            <p className="text-xs text-slate-400">노드</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#1E2A3A]">{edges.length}</p>
            <p className="text-xs text-slate-400">경로</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function EdgeInfo({
  edge,
  nodes,
  onToggleEdgeType,
}: {
  edge: Edge
  nodes: Node[]
  onToggleEdgeType: (id: string) => void
}) {
  const sourceNode = nodes.find((n) => n.id === edge.source)
  const targetNode = nodes.find((n) => n.id === edge.target)
  const isModeration = edge.type === "moderation"

  return (
    <div className="p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">경로 정보</h3>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs text-slate-400">연결</p>
          <p className="mt-1 text-sm font-medium text-[#1E2A3A]">
            {(sourceNode?.data as LatentVariableNodeData)?.label ?? sourceNode?.id}
            {" → "}
            {(targetNode?.data as LatentVariableNodeData)?.label ?? targetNode?.id}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">경로 유형</p>
          <Badge variant={isModeration ? "secondary" : "default"} className="mt-1">
            {isModeration ? "조절 경로" : "일반 경로"}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => onToggleEdgeType(edge.id)}>
          {isModeration ? "일반 경로로 변경" : "조절 경로로 변경"}
        </Button>
      </div>
    </div>
  )
}

function LatentInfo({
  node,
  latentVariables,
}: {
  node: Node | null
  latentVariables: { id: string; name: string; items: { id: string; columnName: string; isReversed: boolean }[] }[]
}) {
  if (!node) return null
  const nodeData = node.data as LatentVariableNodeData
  const variable = latentVariables.find((v) => v.id === nodeData.variableId)

  return (
    <div className="p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">잠재변수 정보</h3>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs text-slate-400">변수명</p>
          <p className="mt-1 text-sm font-semibold text-[#1E2A3A]">{nodeData.label}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">할당 문항</p>
          {variable ? (
            <div className="mt-1 flex flex-col gap-1">
              {variable.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm text-[#1E2A3A]">
                  <span className="truncate">{item.columnName}</span>
                  {item.isReversed && (
                    <Badge variant="outline" className="h-4 px-1 text-[9px] text-orange-600">R</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-400">문항 {nodeData.itemCount}개</p>
          )}
        </div>
        <div>
          <p className="text-xs text-slate-400">Cronbach&apos;s α</p>
          <p className="mt-1 font-mono text-sm text-[#1E2A3A]">
            {nodeData.alpha !== null ? nodeData.alpha.toFixed(3) : "미분석"}
          </p>
        </div>
        {nodeData.ave !== null && (
          <div>
            <p className="text-xs text-slate-400">AVE / CR</p>
            <p className="mt-1 font-mono text-sm text-[#1E2A3A]">
              {nodeData.ave.toFixed(3)} / {nodeData.cr !== null ? nodeData.cr.toFixed(3) : "--"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ModeratorInfo({ node }: { node: Node | null }) {
  if (!node) return null
  const nodeData = node.data as ModeratorNodeData

  return (
    <div className="p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">조절변수 정보</h3>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs text-slate-400">변수명</p>
          <p className="mt-1 text-sm font-semibold text-[#1E2A3A]">{nodeData.label}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">문항 수</p>
          <p className="mt-1 text-sm text-[#1E2A3A]">{nodeData.itemCount}개</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Cronbach&apos;s α</p>
          <p className="mt-1 font-mono text-sm text-[#1E2A3A]">
            {nodeData.alpha !== null ? nodeData.alpha.toFixed(3) : "미분석"}
          </p>
        </div>
        <div className="rounded-md bg-amber-50 p-2">
          <p className="text-xs text-amber-700">
            조절변수에서 경로로 연결하면 조절효과 경로가 자동 생성됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}

function ObservedInfo({ node }: { node: Node | null }) {
  return (
    <div className="p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">관측변수 정보</h3>
      <p className="text-sm font-semibold text-[#1E2A3A]">
        {(node?.data as { label?: string })?.label ?? "--"}
      </p>
    </div>
  )
}
