"use client"

import { Badge } from "@/components/ui/badge"
import { useProjectStore } from "@/lib/store/project-store"
import type { VariableColor } from "@/types/variables"

const COLOR_DOT: Record<VariableColor, string> = {
  blue: "bg-blue-400",
  green: "bg-green-400",
  yellow: "bg-yellow-400",
  purple: "bg-purple-400",
}

interface ItemPanelProps {
  onDragStart: (variableId: string, variableName: string, color: VariableColor, itemCount: number) => void
  nodeVariableIds: Set<string>
}

export default function ItemPanel({ onDragStart, nodeVariableIds }: ItemPanelProps) {
  const latentVariables = useProjectStore((s) => s.latentVariables)

  return (
    <div className="flex h-full w-60 flex-col border-r bg-muted/30">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">문항 패널</h3>
        <p className="text-xs text-muted-foreground">
          잠재변수를 캔버스로 드래그하세요
        </p>
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
