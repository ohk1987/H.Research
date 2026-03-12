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
  type EdgeTypes,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import LatentVariableNode from "./nodes/LatentVariableNode"
import ObservedVariableNode from "./nodes/ObservedVariableNode"
import { ModerationEdgeMemo, EdgeMarkerDefs } from "./EdgeTypes"
import ItemPanel from "./ItemPanel"
import SidePanel from "./SidePanel"
import ModelRecognitionBar from "./ModelRecognitionBar"
import VersionControl from "./VersionControl"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useProjectStore } from "@/lib/store/project-store"
import type { VariableColor } from "@/types/variables"
import type { LatentVariableNodeData } from "./nodes/LatentVariableNode"

const nodeTypes: NodeTypes = {
  latentVariable: LatentVariableNode,
  observedVariable: ObservedVariableNode,
}

const edgeTypes: EdgeTypes = {
  moderation: ModerationEdgeMemo,
}

let nodeIdCounter = 0

export default function ModelCanvas() {
  const storeSetNodes = useProjectStore((s) => s.setCanvasNodes)
  const storeSetEdges = useProjectStore((s) => s.setCanvasEdges)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null)

  // 더블클릭 모달
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createPosition, setCreatePosition] = useState({ x: 0, y: 0 })
  const [newNodeName, setNewNodeName] = useState("")
  const [newNodeColor, setNewNodeColor] = useState<VariableColor>("blue")

  const reactFlowInstance = useRef<ReactFlowInstance | null>(null)

  // 캔버스에 이미 있는 variableId 추적
  const nodeVariableIds = new Set(
    nodes
      .filter((n) => n.type === "latentVariable")
      .map((n) => (n.data as LatentVariableNodeData).variableId)
  )

  // 엣지 연결
  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        type: "default",
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
      }
      setEdges((eds) => {
        const updated = addEdge(newEdge, eds)
        storeSetEdges(updated)
        return updated
      })
    },
    [setEdges, storeSetEdges]
  )

  // 노드 변경 시 스토어 동기화
  const handleNodesChange: typeof onNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes)
      // 약간의 지연 후 스토어 업데이트 (변경이 반영된 후)
      requestAnimationFrame(() => {
        setNodes((nds) => {
          storeSetNodes(nds)
          return nds
        })
      })
    },
    [onNodesChange, setNodes, storeSetNodes]
  )

  // 엣지 변경 시 스토어 동기화
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

  // 노드 선택
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node)
      setSelectedEdge(null)
    },
    []
  )

  // 엣지 선택
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge)
      setSelectedNode(null)
    },
    []
  )

  // 캔버스 클릭 (선택 해제)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setSelectedEdge(null)
  }, [])

  // 캔버스 더블클릭 → 노드 생성 모달
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

  // 잠재변수 노드 생성
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
        variableId,
      } satisfies LatentVariableNodeData,
    }
    setNodes((nds) => {
      const updated = [...nds, newNode]
      storeSetNodes(updated)
      return updated
    })
  }

  // 더블클릭으로 노드 생성
  function handleCreateNode() {
    if (!newNodeName.trim()) return
    createLatentNode(newNodeName.trim(), newNodeColor, createPosition, `manual_${nodeIdCounter}`, 0)
    setShowCreateModal(false)
  }

  // 좌측 패널에서 드래그 시작 데이터
  const dragDataRef = useRef<{
    variableId: string
    name: string
    color: VariableColor
    itemCount: number
  } | null>(null)

  function handlePanelDragStart(variableId: string, name: string, color: VariableColor, itemCount: number) {
    dragDataRef.current = { variableId, name, color, itemCount }
  }

  // 캔버스 드롭
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

  // 엣지 타입 토글
  function toggleEdgeType(edgeId: string) {
    setEdges((eds) => {
      const updated = eds.map((e) => {
        if (e.id !== edgeId) return e
        if (e.type === "moderation") {
          return {
            ...e,
            type: "default",
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
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
      // 선택된 엣지도 업데이트
      const updatedEdge = updated.find((e) => e.id === edgeId)
      if (updatedEdge) setSelectedEdge(updatedEdge)
      return updated
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* 상단 바 */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h3 className="text-sm font-semibold">모델 캔버스</h3>
        <VersionControl nodes={nodes} edges={edges} />
      </div>

      {/* 메인 영역 */}
      <div className="flex flex-1 overflow-hidden">
        <ItemPanel
          onDragStart={handlePanelDragStart}
          nodeVariableIds={nodeVariableIds}
        />

        <div className="relative flex-1">
          <EdgeMarkerDefs />
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
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
              markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
            }}
            fitView
            deleteKeyCode="Delete"
          >
            <Controls position="bottom-left" />
            <MiniMap
              position="bottom-right"
              nodeColor={(n) => {
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
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          </ReactFlow>

          {/* 더블클릭 노드 생성 모달 */}
          {showCreateModal && (
            <>
              <div
                className="absolute inset-0 z-40"
                onClick={() => setShowCreateModal(false)}
              />
              <div
                className="absolute z-50 w-64 rounded-lg border bg-card p-3 shadow-lg"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <p className="mb-2 text-sm font-medium">잠재변수 노드 생성</p>
                <Input
                  placeholder="변수 이름"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateNode()}
                  autoFocus
                />
                <div className="mt-2 flex gap-1">
                  {(["blue", "green", "yellow", "purple"] as VariableColor[]).map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewNodeColor(c)}
                        className={`size-7 rounded border-2 transition-all ${
                          {
                            blue: "bg-blue-100",
                            green: "bg-green-100",
                            yellow: "bg-yellow-100",
                            purple: "bg-purple-100",
                          }[c]
                        } ${
                          newNodeColor === c
                            ? "border-foreground ring-1"
                            : "border-transparent"
                        }`}
                      />
                    )
                  )}
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    disabled={!newNodeName.trim()}
                    onClick={handleCreateNode}
                  >
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
        />
      </div>

      {/* 하단 구조 인식 바 */}
      <ModelRecognitionBar nodes={nodes} edges={edges} />
    </div>
  )
}
