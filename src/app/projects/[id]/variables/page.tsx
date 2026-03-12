"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Trash2,
  ArrowRight,
  GripVertical,
  RotateCcw,
  X,
} from "lucide-react"
import { useProjectStore } from "@/lib/store/project-store"
import { getSampleValues } from "@/lib/utils/file-parser"
import type { VariableColor } from "@/types/variables"

const COLOR_MAP: Record<VariableColor, { bg: string; border: string; label: string }> = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", label: "독립변수" },
  green: { bg: "bg-green-50", border: "border-green-200", label: "종속변수" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-200", label: "매개변수" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", label: "조절변수" },
}

const COLORS: VariableColor[] = ["blue", "green", "yellow", "purple"]

export default function VariablesPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const uploadedData = useProjectStore((s) => s.uploadedData)
  const latentVariables = useProjectStore((s) => s.latentVariables)
  const addLatentVariable = useProjectStore((s) => s.addLatentVariable)
  const removeLatentVariable = useProjectStore((s) => s.removeLatentVariable)
  const updateLatentVariable = useProjectStore((s) => s.updateLatentVariable)
  const assignItemToVariable = useProjectStore((s) => s.assignItemToVariable)
  const unassignItem = useProjectStore((s) => s.unassignItem)
  const toggleItemReverse = useProjectStore((s) => s.toggleItemReverse)

  const [newVarName, setNewVarName] = useState("")
  const [newVarColor, setNewVarColor] = useState<VariableColor>("blue")
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)

  // 데이터가 없으면 업로드 페이지로 안내
  if (!uploadedData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">먼저 데이터를 업로드해주세요.</p>
        <Link href={`/projects/${projectId}/upload`}>
          <Button>데이터 업로드로 이동</Button>
        </Link>
      </div>
    )
  }

  // 할당된 문항 목록
  const assignedColumns = new Set(
    latentVariables.flatMap((v) => v.items.map((i) => i.columnName))
  )

  const totalColumns = uploadedData.headers.length
  const assignedCount = assignedColumns.size
  const allAssigned = assignedCount === totalColumns && totalColumns > 0

  function handleAddVariable() {
    if (!newVarName.trim()) return
    addLatentVariable(newVarName.trim(), newVarColor)
    setNewVarName("")
  }

  function handleColumnDragStart(columnName: string) {
    setDraggedColumn(columnName)
  }

  function handleVariableDrop(variableId: string) {
    if (!draggedColumn || !uploadedData) return
    const colIndex = uploadedData.headers.indexOf(draggedColumn)
    const sampleValues = getSampleValues(uploadedData, colIndex)
    assignItemToVariable(variableId, { columnName: draggedColumn, sampleValues })
    setDraggedColumn(null)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 헤더 */}
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/projects" className="text-xl font-bold">
            H.Research
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>1. 데이터 업로드</span>
            <span>→</span>
            <span className="font-medium text-foreground">2. 변수 설정</span>
            <span>→</span>
            <span>3. 캔버스</span>
          </div>
        </div>
      </header>

      {/* 메인 (2패널 레이아웃) */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-6 py-6">
        {/* 좌측: 문항 목록 */}
        <div className="w-80 shrink-0">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            문항 목록 ({totalColumns}개)
          </h3>
          <div className="flex flex-col gap-1.5">
            {uploadedData.headers.map((header, idx) => {
              const isAssigned = assignedColumns.has(header)
              const samples = getSampleValues(uploadedData, idx)
              return (
                <div
                  key={header}
                  draggable={!isAssigned}
                  onDragStart={() => handleColumnDragStart(header)}
                  onDragEnd={() => setDraggedColumn(null)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    isAssigned
                      ? "border-transparent bg-muted/50 text-muted-foreground line-through"
                      : "cursor-grab border-border bg-card hover:border-primary/50 active:cursor-grabbing"
                  }`}
                >
                  {!isAssigned && (
                    <GripVertical className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{header}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {samples.join(", ")}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 우측: 잠재변수 설정 */}
        <div className="flex-1">
          <div className="mb-4 flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="var-name" className="mb-1.5 block text-sm font-medium">
                잠재변수 추가
              </label>
              <Input
                id="var-name"
                placeholder="잠재변수 이름 (예: 직무만족)"
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddVariable()}
              />
            </div>
            <div className="flex gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewVarColor(color)}
                  className={`size-8 rounded-md border-2 transition-all ${
                    COLOR_MAP[color].bg
                  } ${
                    newVarColor === color
                      ? `${COLOR_MAP[color].border} ring-2 ring-offset-1`
                      : "border-transparent"
                  }`}
                  title={COLOR_MAP[color].label}
                />
              ))}
            </div>
            <Button onClick={handleAddVariable} disabled={!newVarName.trim()}>
              <Plus className="size-4" />
              추가
            </Button>
          </div>

          {/* 잠재변수 카드 목록 */}
          {latentVariables.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                잠재변수를 추가하고 좌측에서 문항을 드래그하여 할당하세요.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {latentVariables.map((variable) => {
                const colorStyle = COLOR_MAP[variable.color]
                return (
                  <Card
                    key={variable.id}
                    className={`${colorStyle.bg} ${colorStyle.border} border`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      handleVariableDrop(variable.id)
                    }}
                  >
                    <CardHeader className="flex-row items-center justify-between pb-0">
                      <div className="flex items-center gap-2">
                        <Input
                          value={variable.name}
                          onChange={(e) =>
                            updateLatentVariable(variable.id, { name: e.target.value })
                          }
                          className="h-7 w-48 border-none bg-transparent px-1 text-base font-semibold shadow-none focus-visible:ring-1"
                        />
                        <Badge variant="secondary">
                          {colorStyle.label}
                        </Badge>
                        <Badge variant="outline">
                          {variable.items.length}개 문항
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeLatentVariable(variable.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {variable.items.length === 0 ? (
                        <div className="rounded-md border-2 border-dashed border-muted-foreground/30 py-6 text-center text-sm text-muted-foreground">
                          문항을 여기에 드래그하세요
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {variable.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-2 rounded-md bg-white/80 px-3 py-1.5 text-sm"
                            >
                              <span className="flex-1 truncate font-medium">
                                {item.columnName}
                              </span>
                              <span className="truncate text-xs text-muted-foreground">
                                {item.sampleValues.slice(0, 2).join(", ")}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  toggleItemReverse(variable.id, item.id)
                                }
                                className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${
                                  item.isReversed
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                                title={item.isReversed ? "역문항 (클릭하여 해제)" : "정방향 (클릭하여 역문항 설정)"}
                              >
                                <RotateCcw className="size-3" />
                                {item.isReversed ? "역" : "정"}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  unassignItem(variable.id, item.id)
                                }
                                className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 하단 바 */}
      <div className="sticky bottom-0 border-t bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <p className="text-sm text-muted-foreground">
            문항 {totalColumns}개 중 {assignedCount}개 할당됨
          </p>
          <Button
            onClick={() => router.push(`/projects/${projectId}/canvas`)}
            disabled={!allAssigned}
          >
            캔버스로
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
