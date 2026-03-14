"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useProjectStore } from "@/lib/store/project-store"
import type { VariableColor } from "@/types/variables"
import { Circle, Hexagon, Square, ChevronDown, Layout } from "lucide-react"

const COLOR_DOT: Record<VariableColor, string> = {
  blue: "bg-blue-400",
  green: "bg-green-400",
  yellow: "bg-yellow-400",
  purple: "bg-purple-400",
}

export type NodeCreationType = "latentVariable" | "observedVariable" | "moderator"

export interface TemplateConfig {
  id: string
  label: string
  description: string
  nodes: { type: NodeCreationType; label: string; role: NodeRole; position: { x: number; y: number } }[]
  edges: { sourceIdx: number; targetIdx: number; type?: string }[]
}

export type NodeRole = "independent" | "mediator" | "moderator" | "dependent"

export const TEMPLATES: TemplateConfig[] = [
  {
    id: "simple-mediation",
    label: "단순 매개 모형",
    description: "X → M → Y (Model 4)",
    nodes: [
      { type: "latentVariable", label: "독립변수", role: "independent", position: { x: 100, y: 250 } },
      { type: "latentVariable", label: "매개변수", role: "mediator", position: { x: 400, y: 100 } },
      { type: "latentVariable", label: "종속변수", role: "dependent", position: { x: 700, y: 250 } },
    ],
    edges: [
      { sourceIdx: 0, targetIdx: 1 },
      { sourceIdx: 1, targetIdx: 2 },
      { sourceIdx: 0, targetIdx: 2 },
    ],
  },
  {
    id: "simple-moderation",
    label: "단순 조절 모형",
    description: "X → Y, W 조절 (Model 1)",
    nodes: [
      { type: "latentVariable", label: "독립변수", role: "independent", position: { x: 100, y: 250 } },
      { type: "moderator", label: "조절변수", role: "moderator", position: { x: 400, y: 80 } },
      { type: "latentVariable", label: "종속변수", role: "dependent", position: { x: 700, y: 250 } },
    ],
    edges: [
      { sourceIdx: 0, targetIdx: 2 },
      { sourceIdx: 1, targetIdx: 2, type: "moderation" },
    ],
  },
  {
    id: "moderated-mediation",
    label: "조절된 매개 모형",
    description: "X → M → Y, W 조절 (Model 7)",
    nodes: [
      { type: "latentVariable", label: "독립변수", role: "independent", position: { x: 100, y: 250 } },
      { type: "latentVariable", label: "매개변수", role: "mediator", position: { x: 400, y: 250 } },
      { type: "moderator", label: "조절변수", role: "moderator", position: { x: 250, y: 80 } },
      { type: "latentVariable", label: "종속변수", role: "dependent", position: { x: 700, y: 250 } },
    ],
    edges: [
      { sourceIdx: 0, targetIdx: 1 },
      { sourceIdx: 1, targetIdx: 3 },
      { sourceIdx: 0, targetIdx: 3 },
      { sourceIdx: 2, targetIdx: 1, type: "moderation" },
    ],
  },
  {
    id: "sem-basic",
    label: "SEM 기본형",
    description: "잠재변수 3개 구조모형",
    nodes: [
      { type: "latentVariable", label: "잠재변수 1", role: "independent", position: { x: 100, y: 200 } },
      { type: "latentVariable", label: "잠재변수 2", role: "mediator", position: { x: 400, y: 200 } },
      { type: "latentVariable", label: "잠재변수 3", role: "dependent", position: { x: 700, y: 200 } },
    ],
    edges: [
      { sourceIdx: 0, targetIdx: 1 },
      { sourceIdx: 1, targetIdx: 2 },
    ],
  },
]

interface ItemPanelProps {
  onDragStart: (variableId: string, variableName: string, color: VariableColor, itemCount: number) => void
  nodeVariableIds: Set<string>
  onAddNode?: (type: NodeCreationType) => void
  onApplyTemplate?: (template: TemplateConfig) => void
}

export default function ItemPanel({ onDragStart, nodeVariableIds, onAddNode, onApplyTemplate }: ItemPanelProps) {
  const latentVariables = useProjectStore((s) => s.latentVariables)
  const [showTemplates, setShowTemplates] = useState(false)

  return (
    <div className="flex h-full w-60 flex-col border-r bg-muted/30">
      {/* 노드 추가 도구 */}
      <div className="border-b px-4 py-3">
        <h3 className="mb-2 text-sm font-semibold text-[#1E2A3A]">노드 추가</h3>
        <div className="flex flex-col gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="justify-start gap-2 text-xs"
            onClick={() => onAddNode?.("latentVariable")}
          >
            <Circle className="size-3.5 text-blue-500" />
            잠재변수
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-start gap-2 text-xs"
            onClick={() => onAddNode?.("observedVariable")}
          >
            <Square className="size-3.5 text-gray-500" />
            관측변수
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-start gap-2 text-xs"
            onClick={() => onAddNode?.("moderator")}
          >
            <Hexagon className="size-3.5 text-amber-500" />
            조절변수
          </Button>
        </div>
      </div>

      {/* 템플릿 드롭다운 */}
      <div className="border-b px-4 py-3">
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="flex w-full items-center justify-between text-sm font-semibold text-[#1E2A3A]"
        >
          <span className="flex items-center gap-1.5">
            <Layout className="size-3.5" />
            연구모형 템플릿
          </span>
          <ChevronDown className={`size-3.5 transition-transform ${showTemplates ? "rotate-180" : ""}`} />
        </button>
        {showTemplates && (
          <div className="mt-2 flex flex-col gap-1.5">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onApplyTemplate?.(t)}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:border-[#1E2A3A]/30 hover:bg-slate-50"
              >
                <p className="text-xs font-medium text-[#1E2A3A]">{t.label}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{t.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 변수 목록 (드래그) */}
      <div className="border-b px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">잠재변수 목록</h3>
        <p className="text-[10px] text-muted-foreground">캔버스로 드래그하세요</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {latentVariables.length === 0 ? (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            설정된 잠재변수가 없습니다
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {latentVariables.map((variable) => {
              const isOnCanvas = nodeVariableIds.has(variable.id)
              return (
                <div
                  key={variable.id}
                  draggable={!isOnCanvas}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/reactflow-variable", variable.id)
                    onDragStart(variable.id, variable.name, variable.color, variable.items.length)
                  }}
                  className={`rounded-lg border p-2.5 text-sm transition-colors ${
                    isOnCanvas
                      ? "cursor-default border-transparent bg-muted/50 opacity-50"
                      : "cursor-grab border-border bg-card hover:border-primary/40 active:cursor-grabbing"
                  }`}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className={`size-2.5 rounded-full ${COLOR_DOT[variable.color]}`} />
                    <span className="font-medium">{variable.name}</span>
                    {isOnCanvas && (
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        배치됨
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 pl-4">
                    {variable.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="truncate">{item.columnName}</span>
                        {item.isReversed && (
                          <Badge variant="outline" className="h-4 px-1 text-[9px] text-orange-600">
                            R
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
