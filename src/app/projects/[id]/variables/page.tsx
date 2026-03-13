"use client"

import { useState, useRef, useEffect } from "react"
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
  RotateCcw,
  X,
  ChevronDown,
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

function ItemDropdown({
  variableId,
  availableColumns,
  uploadedData,
}: {
  variableId: string
  availableColumns: string[]
  uploadedData: { headers: string[]; rows: (string | number | null)[][]; rowCount: number }
}) {
  const [open, setOpen] = useState(false)
  const [manualInput, setManualInput] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const assignItemToVariable = useProjectStore((s) => s.assignItemToVariable)

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  function handleSelectColumn(columnName: string) {
    const colIndex = uploadedData.headers.indexOf(columnName)
    const sampleValues = getSampleValues(uploadedData, colIndex)
    assignItemToVariable(variableId, { columnName, sampleValues })
    setOpen(false)
  }

  function handleAddManual() {
    const name = manualInput.trim()
    if (!name) return
    assignItemToVariable(variableId, { columnName: name, sampleValues: [] })
    setManualInput("")
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-between text-muted-foreground"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-1">
          <Plus className="size-3.5" />
          문항 추가
        </span>
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
          {/* 직접 입력 */}
          <div className="flex gap-1 border-b p-2">
            <Input
              placeholder="직접 입력..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddManual()}
              className="h-7 text-sm"
            />
            <Button
              size="sm"
              variant="secondary"
              className="h-7 shrink-0 px-2 text-xs"
              onClick={handleAddManual}
              disabled={!manualInput.trim()}
            >
              추가
            </Button>
          </div>

          {/* 사용 가능한 문항 목록 */}
          <div className="max-h-48 overflow-y-auto">
            {availableColumns.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                할당 가능한 문항이 없습니다
              </p>
            ) : (
              availableColumns.map((col) => {
                const colIndex = uploadedData.headers.indexOf(col)
                const samples = getSampleValues(uploadedData, colIndex)
                return (
                  <button
                    key={col}
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => handleSelectColumn(col)}
                  >
                    <span className="flex-1 truncate font-medium">{col}</span>
                    <span className="shrink-0 truncate text-xs text-muted-foreground">
                      {samples.slice(0, 2).join(", ")}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function VariablesPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const uploadedData = useProjectStore((s) => s.uploadedData)
  const latentVariables = useProjectStore((s) => s.latentVariables)
  const addLatentVariable = useProjectStore((s) => s.addLatentVariable)
  const removeLatentVariable = useProjectStore((s) => s.removeLatentVariable)
  const updateLatentVariable = useProjectStore((s) => s.updateLatentVariable)
  const unassignItem = useProjectStore((s) => s.unassignItem)
  const toggleItemReverse = useProjectStore((s) => s.toggleItemReverse)

  const [newVarName, setNewVarName] = useState("")
  const [newVarColor, setNewVarColor] = useState<VariableColor>("blue")

  // 할당된 문항 목록
  const assignedColumns = new Set(
    latentVariables.flatMap((v) => v.items.map((i) => i.columnName))
  )

  // 아직 할당되지 않은 문항
  const availableColumns = uploadedData
    ? uploadedData.headers.filter((h) => !assignedColumns.has(h))
    : []

  const totalColumns = uploadedData?.headers.length ?? 0
  const assignedCount = assignedColumns.size
  const hasItems = latentVariables.some((v) => v.items.length > 0)

  function handleAddVariable() {
    if (!newVarName.trim()) return
    addLatentVariable(newVarName.trim(), newVarColor)
    setNewVarName("")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 헤더 */}
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/projects" className="text-xl font-bold">
            H.Research
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {uploadedData && (
              <>
                <span>1. 데이터 업로드</span>
                <span>&rarr;</span>
              </>
            )}
            <span className="font-medium text-foreground">
              {uploadedData ? "2. 변수 설정" : "1. 변수 설정"}
            </span>
            <span>&rarr;</span>
            <span>{uploadedData ? "3. 캔버스" : "2. 설문 제작"}</span>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-6">
        {/* 잠재변수 추가 입력 */}
        <div className="mb-6 flex items-end gap-3">
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
              잠재변수를 추가한 뒤, 각 변수에 문항을 할당하세요.
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
                    {/* 할당된 문항 목록 */}
                    {variable.items.length > 0 && (
                      <div className="mb-3 flex flex-col gap-1.5">
                        {variable.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 rounded-md bg-white/80 px-3 py-1.5 text-sm"
                          >
                            <span className="flex-1 truncate font-medium">
                              {item.columnName}
                            </span>
                            {item.sampleValues.length > 0 && (
                              <span className="truncate text-xs text-muted-foreground">
                                {item.sampleValues.slice(0, 2).join(", ")}
                              </span>
                            )}
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

                    {/* 드롭다운: 문항 추가 */}
                    {uploadedData ? (
                      <ItemDropdown
                        variableId={variable.id}
                        availableColumns={availableColumns}
                        uploadedData={uploadedData}
                      />
                    ) : (
                      // 데이터 없는 경우 (설문부터 시작): 직접 입력만 가능
                      <ManualItemInput variableId={variable.id} />
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* 하단 바 */}
      <div className="sticky bottom-0 border-t bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <p className="text-sm text-muted-foreground">
            {uploadedData
              ? `문항 ${totalColumns}개 중 ${assignedCount}개 할당됨`
              : `잠재변수 ${latentVariables.length}개 / 문항 ${assignedCount}개`}
          </p>
          <Button
            onClick={() => {
              if (uploadedData) {
                router.push(`/projects/${projectId}/canvas`)
              } else {
                router.push(`/projects/${projectId}/sample-size`)
              }
            }}
            disabled={!hasItems}
          >
            {uploadedData ? "캔버스로" : "다음 단계"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// 데이터 없이 직접 문항을 입력하는 컴포넌트
function ManualItemInput({ variableId }: { variableId: string }) {
  const [value, setValue] = useState("")
  const assignItemToVariable = useProjectStore((s) => s.assignItemToVariable)

  function handleAdd() {
    const name = value.trim()
    if (!name) return
    assignItemToVariable(variableId, { columnName: name, sampleValues: [] })
    setValue("")
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="문항 내용 입력 (예: 나는 직무에 만족한다)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        className="h-8 text-sm"
      />
      <Button
        variant="outline"
        size="sm"
        className="shrink-0"
        onClick={handleAdd}
        disabled={!value.trim()}
      >
        <Plus className="size-3.5" />
        추가
      </Button>
    </div>
  )
}
