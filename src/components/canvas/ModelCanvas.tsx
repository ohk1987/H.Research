"use client"

import { useCallback, useRef, useState } from "react"
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  type Connection,
  type NodeTypes,
  type EdgeTypes as RFEdgeTypes,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import LatentVariableNode from "./nodes/LatentVariableNode"
import ObservedVariableNode from "./nodes/ObservedVariableNode"
import ModeratorNode from "./nodes/ModeratorNode"
import { ModerationEdgeMemo, EdgeMarkerDefs } from "./EdgeTypes"
import { StatEdgeMemo, StatEdgeMarkerDefs } from "./StatEdge"
import ItemPanel, { type NodeCreationType, type TemplateConfig, type NodeRole } from "./ItemPanel"
import SidePanel from "./SidePanel"
import NodeContextMenu from "./NodeContextMenu"
import ModelRecognitionBar from "./ModelRecognitionBar"
import VersionControl from "./VersionControl"
import ResultPanel, { type AnalysisResultData } from "./ResultPanel"
import AnalysisProgress, { type AnalysisStep } from "./AnalysisProgress"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useProjectStore } from "@/lib/store/project-store"
import { DEFAULT_OPTIONS, type AnalysisOptions } from "@/types/analysis"
import type { VariableColor } from "@/types/variables"
import type { LatentVariableNodeData } from "./nodes/LatentVariableNode"
import type { ModeratorNodeData } from "./nodes/ModeratorNode"
import type { StatEdgeData } from "./StatEdge"
import { Play, Send } from "lucide-react"

const nodeTypes: NodeTypes = {
  latentVariable: LatentVariableNode,
  observedVariable: ObservedVariableNode,
  moderator: ModeratorNode,
}

const edgeTypes: RFEdgeTypes = {
  moderation: ModerationEdgeMemo,
  stat: StatEdgeMemo,
}

// 역할 → 색상 매핑
const ROLE_COLOR: Record<NodeRole, VariableColor> = {
  independent: "blue",
  mediator: "yellow",
  moderator: "purple",
  dependent: "green",
}

let nodeIdCounter = 0

export default function ModelCanvas() {
  const storeSetNodes = useProjectStore((s) => s.setCanvasNodes)
  const storeSetEdges = useProjectStore((s) => s.setCanvasEdges)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null)

  // 분석 상태
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>(DEFAULT_OPTIONS)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>("validate")

  // 더블클릭 모달
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createPosition, setCreatePosition] = useState({ x: 0, y: 0 })
  const [newNodeName, setNewNodeName] = useState("")
  const [newNodeColor, setNewNodeColor] = useState<VariableColor>("blue")

  // 컨텍스트 메뉴
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    nodeId: string
  } | null>(null)

  const reactFlowInstance = useRef<ReactFlowInstance | null>(null)

  const nodeVariableIds = new Set(
    nodes
      .filter((n) => n.type === "latentVariable")
      .map((n) => (n.data as LatentVariableNodeData).variableId)
  )

  // 엣지 연결
  const onConnect = useCallback(
    (connection: Connection) => {
      // 조절변수에서 나오는 연결은 조절 경로로 생성
      const sourceNode = nodes.find((n) => n.id === connection.source)
      const isModerator = sourceNode?.type === "moderator"

      const newEdge = isModerator
        ? {
            ...connection,
            type: "moderation",
            markerEnd: undefined,
            data: { isModeration: true },
          }
        : {
            ...connection,
            type: "stat",
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
            data: { analyzed: false } satisfies StatEdgeData,
          }

      setEdges((eds) => {
        const updated = addEdge(newEdge, eds)
        storeSetEdges(updated)
        return updated
      })
    },
    [setEdges, storeSetEdges, nodes]
  )

  const handleNodesChange: typeof onNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes)
      requestAnimationFrame(() => {
        setNodes((nds) => {
          storeSetNodes(nds)
          return nds
        })
      })
    },
    [onNodesChange, setNodes, storeSetNodes]
  )

  const handleEdgesChange: typeof onEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes)
      requestAnimationFrame(() => {
        setEdges((eds) => {
          storeSetEdges(eds)
          return eds
        })
      })
    },
    [onEdgesChange, setEdges, storeSetEdges]
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setSelectedEdge(null)
    setContextMenu(null)
  }, [])

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge)
    setSelectedNode(null)
    setContextMenu(null)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setSelectedEdge(null)
    setContextMenu(null)
  }, [])

  // 노드 우클릭 → 컨텍스트 메뉴
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault()
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    })
  }, [])

  const onDoubleClick = useCallback(
    (_: React.MouseEvent, event: { x: number; y: number } | undefined) => {
      if (!reactFlowInstance.current || !event) return
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.x,
        y: event.y,
      })
      setCreatePosition(position)
      setShowCreateModal(true)
      setNewNodeName("")
    },
    []
  )

  function createLatentNode(
    name: string,
    color: VariableColor,
    position: { x: number; y: number },
    variableId: string,
    itemCount: number
  ) {
    const id = `node_${++nodeIdCounter}`
    const newNode: Node = {
      id,
      type: "latentVariable",
      position,
      data: {
        label: name,
        color,
        itemCount,
        alpha: null,
        ave: null,
        cr: null,
        variableId,
      } satisfies LatentVariableNodeData,
    }
    setNodes((nds) => {
      const updated = [...nds, newNode]
      storeSetNodes(updated)
      return updated
    })
    return id
  }

  function createModeratorNode(
    name: string,
    position: { x: number; y: number }
  ) {
    const id = `node_${++nodeIdCounter}`
    const newNode: Node = {
      id,
      type: "moderator",
      position,
      data: {
        label: name,
        variableId: `mod_${nodeIdCounter}`,
        itemCount: 0,
        alpha: null,
      } satisfies ModeratorNodeData,
    }
    setNodes((nds) => {
      const updated = [...nds, newNode]
      storeSetNodes(updated)
      return updated
    })
    return id
  }

  function createObservedNode(
    name: string,
    position: { x: number; y: number }
  ) {
    const id = `node_${++nodeIdCounter}`
    const newNode: Node = {
      id,
      type: "observedVariable",
      position,
      data: {
        label: name,
        columnName: name,
      },
    }
    setNodes((nds) => {
      const updated = [...nds, newNode]
      storeSetNodes(updated)
      return updated
    })
    return id
  }

  function handleCreateNode() {
    if (!newNodeName.trim()) return
    createLatentNode(newNodeName.trim(), newNodeColor, createPosition, `manual_${nodeIdCounter}`, 0)
    setShowCreateModal(false)
  }

  // 도구 패널에서 노드 추가
  function handleAddNodeFromToolbox(type: NodeCreationType) {
    const center = reactFlowInstance.current
      ? reactFlowInstance.current.screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        })
      : { x: 300, y: 200 }

    // 기존 노드와 겹치지 않게 약간 오프셋
    const offset = nodes.length * 30
    const position = { x: center.x + offset, y: center.y + offset }

    if (type === "latentVariable") {
      createLatentNode("새 잠재변수", "blue", position, `manual_${nodeIdCounter + 1}`, 0)
    } else if (type === "observedVariable") {
      createObservedNode("새 관측변수", position)
    } else if (type === "moderator") {
      createModeratorNode("조절변수", position)
    }
  }

  // 템플릿 적용
  function handleApplyTemplate(template: TemplateConfig) {
    // 기존 노드/엣지 클리어
    setNodes([])
    setEdges([])

    const nodeIds: string[] = []

    // 노드 생성
    const newNodes: Node[] = template.nodes.map((tn) => {
      const id = `node_${++nodeIdCounter}`
      nodeIds.push(id)

      if (tn.type === "moderator") {
        return {
          id,
          type: "moderator",
          position: tn.position,
          data: {
            label: tn.label,
            variableId: `tpl_${nodeIdCounter}`,
            itemCount: 0,
            alpha: null,
          } satisfies ModeratorNodeData,
        }
      }

      if (tn.type === "observedVariable") {
        return {
          id,
          type: "observedVariable",
          position: tn.position,
          data: { label: tn.label, columnName: tn.label },
        }
      }

      return {
        id,
        type: "latentVariable",
        position: tn.position,
        data: {
          label: tn.label,
          color: ROLE_COLOR[tn.role],
          itemCount: 0,
          alpha: null,
          ave: null,
          cr: null,
          variableId: `tpl_${nodeIdCounter}`,
        } satisfies LatentVariableNodeData,
      }
    })

    // 엣지 생성
    const newEdges: Edge[] = template.edges.map((te, idx) => {
      const isModeration = te.type === "moderation"
      return {
        id: `edge_tpl_${idx}`,
        source: nodeIds[te.sourceIdx],
        target: nodeIds[te.targetIdx],
        type: isModeration ? "moderation" : "stat",
        markerEnd: isModeration
          ? undefined
          : { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        data: isModeration
          ? { isModeration: true }
          : ({ analyzed: false } satisfies StatEdgeData),
      }
    })

    setNodes(newNodes)
    setEdges(newEdges)
    storeSetNodes(newNodes)
    storeSetEdges(newEdges)
  }

  // 역할 변경
  function handleSetRole(nodeId: string, role: NodeRole) {
    setNodes((nds) => {
      const updated = nds.map((n) => {
        if (n.id !== nodeId) return n

        // 조절변수 역할로 변경 시 노드 타입도 변경
        if (role === "moderator" && n.type !== "moderator") {
          return {
            ...n,
            type: "moderator",
            data: {
              label: (n.data as LatentVariableNodeData).label ?? "조절변수",
              variableId: (n.data as LatentVariableNodeData).variableId ?? `mod_${nodeIdCounter}`,
              itemCount: (n.data as LatentVariableNodeData).itemCount ?? 0,
              alpha: null,
            } satisfies ModeratorNodeData,
          }
        }

        // 조절변수에서 다른 역할로 변경 시 잠재변수 타입으로 복원
        if (role !== "moderator" && n.type === "moderator") {
          return {
            ...n,
            type: "latentVariable",
            data: {
              label: (n.data as ModeratorNodeData).label ?? "잠재변수",
              color: ROLE_COLOR[role],
              itemCount: (n.data as ModeratorNodeData).itemCount ?? 0,
              alpha: null,
              ave: null,
              cr: null,
              variableId: (n.data as ModeratorNodeData).variableId ?? `manual_${nodeIdCounter}`,
            } satisfies LatentVariableNodeData,
          }
        }

        // 잠재변수 내 색상만 변경
        if (n.type === "latentVariable") {
          return {
            ...n,
            data: {
              ...(n.data as LatentVariableNodeData),
              color: ROLE_COLOR[role],
            },
          }
        }

        return n
      })
      storeSetNodes(updated)
      return updated
    })
  }

  // 노드 삭제
  function handleDeleteNode(nodeId: string) {
    setNodes((nds) => {
      const updated = nds.filter((n) => n.id !== nodeId)
      storeSetNodes(updated)
      return updated
    })
    setEdges((eds) => {
      const updated = eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      storeSetEdges(updated)
      return updated
    })
    if (selectedNode?.id === nodeId) setSelectedNode(null)
  }

  // 현재 노드의 역할 추정
  function getNodeRole(nodeId: string): NodeRole | null {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return null
    if (node.type === "moderator") return "moderator"
    if (node.type === "latentVariable") {
      const color = (node.data as LatentVariableNodeData).color
      const colorToRole: Record<string, NodeRole> = {
        blue: "independent",
        yellow: "mediator",
        purple: "moderator",
        green: "dependent",
      }
      return colorToRole[color] ?? null
    }
    return null
  }

  const dragDataRef = useRef<{
    variableId: string
    name: string
    color: VariableColor
    itemCount: number
  } | null>(null)

  function handlePanelDragStart(variableId: string, name: string, color: VariableColor, itemCount: number) {
    dragDataRef.current = { variableId, name, color, itemCount }
  }

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      if (!reactFlowInstance.current || !dragDataRef.current) return
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      const { variableId, name, color, itemCount } = dragDataRef.current
      createLatentNode(name, color, position, variableId, itemCount)
      dragDataRef.current = null
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setNodes, storeSetNodes]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  function toggleEdgeType(edgeId: string) {
    setEdges((eds) => {
      const updated = eds.map((e) => {
        if (e.id !== edgeId) return e
        if (e.type === "moderation") {
          return {
            ...e,
            type: "stat",
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
            data: { analyzed: false } satisfies StatEdgeData,
          }
        }
        return {
          ...e,
          type: "moderation",
          markerEnd: undefined,
          data: { isModeration: true },
        }
      })
      storeSetEdges(updated)
      const updatedEdge = updated.find((e) => e.id === edgeId)
      if (updatedEdge) setSelectedEdge(updatedEdge)
      return updated
    })
  }

  // ─── 분석 실행 (데모) ───
  async function handleRunAnalysis() {
    if (nodes.length === 0) return
    setAnalyzing(true)

    // 단계별 진행
    setAnalysisStep("validate")
    await delay(800)
    setAnalysisStep("structure")
    await delay(600)
    setAnalysisStep("engine")
    await delay(1500)
    setAnalysisStep("process")
    await delay(600)

    // 데모 결과 생성
    const demoResult = generateDemoResult(nodes, edges)
    setAnalysisResult(demoResult)

    // 엣지에 통계값 적용
    setEdges((eds) => {
      const updated = eds.map((e) => {
        if (e.type === "moderation") return e
        const path = demoResult.paths?.find((p) => {
          const srcNode = nodes.find((n) => n.id === e.source)
          const tgtNode = nodes.find((n) => n.id === e.target)
          const srcLabel = srcNode?.type === "moderator"
            ? (srcNode.data as ModeratorNodeData).label
            : (srcNode?.data as LatentVariableNodeData)?.label
          const tgtLabel = tgtNode?.type === "moderator"
            ? (tgtNode.data as ModeratorNodeData).label
            : (tgtNode?.data as LatentVariableNodeData)?.label
          return p.from === srcLabel && p.to === tgtLabel
        })
        if (path) {
          return {
            ...e,
            type: "stat",
            data: {
              beta: path.beta,
              se: path.se,
              pValue: path.pValue,
              analyzed: true,
            } satisfies StatEdgeData,
          }
        }
        return e
      })
      storeSetEdges(updated)
      return updated
    })

    // 노드에 신뢰도 적용
    setNodes((nds) => {
      const updated = nds.map((n) => {
        if (n.type !== "latentVariable") return n
        const nodeData = n.data as LatentVariableNodeData
        const rel = demoResult.reliability?.find((r) => r.variable === nodeData.label)
        if (rel) {
          return {
            ...n,
            data: {
              ...nodeData,
              alpha: rel.alpha,
              ave: rel.ave,
              cr: rel.cr,
            },
          }
        }
        return n
      })
      storeSetNodes(updated)
      return updated
    })

    setAnalyzing(false)
  }

  function handleOptionsChange(partial: Partial<AnalysisOptions>) {
    setAnalysisOptions((prev) => ({ ...prev, ...partial }))
  }

  return (
    <div className="flex h-full flex-col">
      {/* 상단 툴바 */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleRunAnalysis}
            disabled={analyzing || nodes.length === 0}
            className="gap-1.5"
          >
            <Play className="size-3.5" />
            분석 실행
          </Button>
          <VersionControl nodes={nodes} edges={edges} />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Send className="size-3.5" />
          검토 요청
        </Button>
      </div>

      {/* 메인 영역: 캔버스 + 우측패널 */}
      <div className="flex flex-1 overflow-hidden">
        <ItemPanel
          onDragStart={handlePanelDragStart}
          nodeVariableIds={nodeVariableIds}
          onAddNode={handleAddNodeFromToolbox}
          onApplyTemplate={handleApplyTemplate}
        />

        <div className="relative flex-1">
          <EdgeMarkerDefs />
          <StatEdgeMarkerDefs />
          <AnalysisProgress currentStep={analysisStep} visible={analyzing} />

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onNodeContextMenu={onNodeContextMenu}
            onDoubleClick={(event) => {
              onDoubleClick(event, { x: event.clientX, y: event.clientY })
            }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onInit={(instance) => {
              reactFlowInstance.current = instance
            }}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{
              type: "stat",
              markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
              data: { analyzed: false } satisfies StatEdgeData,
            }}
            fitView
            deleteKeyCode="Delete"
          >
            <Controls position="bottom-left" />
            <MiniMap
              position="bottom-right"
              nodeColor={(n) => {
                if (n.type === "moderator") return "#fbbf24"
                if (n.type === "latentVariable") {
                  const c = (n.data as LatentVariableNodeData).color
                  const map: Record<string, string> = {
                    blue: "#60a5fa",
                    green: "#4ade80",
                    yellow: "#facc15",
                    purple: "#c084fc",
                  }
                  return map[c] || "#94a3b8"
                }
                return "#94a3b8"
              }}
            />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e2e8f0" />
          </ReactFlow>

          {/* 노드 컨텍스트 메뉴 */}
          {contextMenu && (
            <NodeContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              nodeId={contextMenu.nodeId}
              currentRole={getNodeRole(contextMenu.nodeId)}
              onSetRole={handleSetRole}
              onDelete={handleDeleteNode}
              onClose={() => setContextMenu(null)}
            />
          )}

          {/* 더블클릭 노드 생성 모달 */}
          {showCreateModal && (
            <>
              <div
                className="absolute inset-0 z-40"
                onClick={() => setShowCreateModal(false)}
              />
              <div
                className="absolute z-50 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
                style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
              >
                <p className="mb-3 text-sm font-semibold text-[#1E2A3A]">잠재변수 노드 생성</p>
                <Input
                  placeholder="변수 이름"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateNode()}
                  autoFocus
                  className="h-9"
                />
                <div className="mt-3 flex gap-1">
                  {(["blue", "green", "yellow", "purple"] as VariableColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewNodeColor(c)}
                      className={`size-7 rounded border-2 transition-all ${
                        { blue: "bg-blue-100", green: "bg-green-100", yellow: "bg-yellow-100", purple: "bg-purple-100" }[c]
                      } ${newNodeColor === c ? "border-[#1E2A3A] ring-1" : "border-transparent"}`}
                    />
                  ))}
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                    취소
                  </Button>
                  <Button size="sm" disabled={!newNodeName.trim()} onClick={handleCreateNode}>
                    생성
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <SidePanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          nodes={nodes}
          edges={edges}
          onToggleEdgeType={toggleEdgeType}
          analysisOptions={analysisOptions}
          onOptionsChange={handleOptionsChange}
        />
      </div>

      {/* 하단 결과 패널 */}
      <ResultPanel
        result={analysisResult}
        onRequestInterpretation={() => {
          // Claude API 해석 생성 (데모)
          setAnalysisResult((prev) =>
            prev
              ? {
                  ...prev,
                  interpretation:
                    "구조방정식 모형의 적합도를 검증한 결과, 주요 적합도 지수가 기준을 충족하는 것으로 나타났다. " +
                    "경로분석 결과, 주요 경로의 표준화 계수(β)와 유의확률(p)을 확인하였으며, " +
                    "직접효과와 간접효과의 통계적 유의성이 검증되었다.",
                }
              : prev
          )
        }}
      />

      {/* ModelRecognitionBar는 결과 패널 아래 */}
      <ModelRecognitionBar nodes={nodes} edges={edges} />
    </div>
  )
}

// ─── 유틸 ───

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 데모 분석 결과 생성
function generateDemoResult(nodes: Node[], edges: Edge[]): AnalysisResultData {
  const latentNodes = nodes.filter((n) => n.type === "latentVariable")

  // 적합도 (데모)
  const fit = {
    cfi: 0.953,
    tli: 0.941,
    rmsea: 0.052,
    srmr: 0.048,
    chi_sq_df: 2.134,
  }

  // 경로계수 (데모: 엣지 기반)
  const paths: AnalysisResultData["paths"] = edges
    .filter((e) => e.type !== "moderation")
    .map((e) => {
      const srcNode = nodes.find((n) => n.id === e.source)
      const tgtNode = nodes.find((n) => n.id === e.target)
      const srcLabel = srcNode?.type === "moderator"
        ? (srcNode.data as ModeratorNodeData).label
        : (srcNode?.data as LatentVariableNodeData)?.label ?? e.source
      const tgtLabel = tgtNode?.type === "moderator"
        ? (tgtNode.data as ModeratorNodeData).label
        : (tgtNode?.data as LatentVariableNodeData)?.label ?? e.target
      const beta = Math.round((Math.random() * 0.6 + 0.1) * 1000) / 1000
      const se = Math.round((Math.random() * 0.05 + 0.02) * 1000) / 1000
      const pValue = Math.random() < 0.7 ? Math.random() * 0.04 : Math.random() * 0.3 + 0.05
      return {
        from: srcLabel,
        to: tgtLabel,
        beta,
        se,
        pValue: Math.round(pValue * 1000) / 1000,
        ci: [beta - 1.96 * se, beta + 1.96 * se] as [number, number],
      }
    })

  // 신뢰도 (데모)
  const reliability = latentNodes.map((n) => {
    const nodeData = n.data as LatentVariableNodeData
    return {
      variable: nodeData.label,
      alpha: Math.round((Math.random() * 0.2 + 0.75) * 1000) / 1000,
      ave: Math.round((Math.random() * 0.3 + 0.45) * 1000) / 1000,
      cr: Math.round((Math.random() * 0.2 + 0.7) * 1000) / 1000,
    }
  })

  return { fit, paths, reliability }
}
