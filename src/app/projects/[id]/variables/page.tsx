"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  X,
  RotateCcw,
  ArrowRight,
  ChevronDown,
  Variable,
  FileText,
  Info,
} from "lucide-react"
import { useProjectStore } from "@/lib/store/project-store"
import { getSampleValues } from "@/lib/utils/file-parser"

// ─── 표본 크기 자동 계산 ──────────────────────────
function calcSampleSize(varCount: number, itemCount: number) {
  // SEM 기준: 문항 수 * 10 또는 200 중 큰 값을 최소, 문항 수 * 15를 권장
  const byItems = itemCount * 10
  const min = Math.max(byItems, 200)
  const recommended = Math.max(itemCount * 15, min + 50)
  return { min, recommended }
}

// ─── 토스트 ──────────────────────────────────────
function Toast({
  message,
  sub,
  linkText,
  linkHref,
  onClose,
}: {
  message: string
  sub: string
  linkText?: string
  linkHref?: string
  onClose: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 8000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-lg">
        <Info className="mt-0.5 size-4 shrink-0 text-blue-500" />
        <div>
          <p className="text-sm font-medium text-[#1E2A3A]">{message}</p>
          <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
          {linkText && linkHref && (
            <a
              href={linkHref}
              className="mt-1.5 inline-block text-xs font-medium text-[#1E2A3A] underline underline-offset-2"
            >
              {linkText}
            </a>
          )}
        </div>
        <button type="button" onClick={onClose} className="text-slate-300 hover:text-slate-500">
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── 컬럼 드롭다운 (데이터 있을 때) ────────────────
function ColumnDropdown({
  variableId,
  availableColumns,
  uploadedData,
}: {
  variableId: string
  availableColumns: string[]
  uploadedData: { headers: string[]; rows: (string | number | null)[][]; rowCount: number }
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const assignItemToVariable = useProjectStore((s) => s.assignItemToVariable)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) {
      document.addEventListener("mousedown", handler)
      return () => document.removeEventListener("mousedown", handler)
    }
  }, [open])

  function handleSelect(col: string) {
    const idx = uploadedData.headers.indexOf(col)
    assignItemToVariable(variableId, {
      columnName: col,
      sampleValues: getSampleValues(uploadedData, idx),
    })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 transition-colors hover:border-slate-300"
      >
        <span className="flex items-center gap-1.5">
          <Plus className="size-3.5" />
          컬럼 선택하여 추가
        </span>
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="max-h-52 overflow-y-auto py-1">
            {availableColumns.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-slate-400">
                모든 컬럼이 할당되었습니다
              </p>
            ) : (
              availableColumns.map((col) => {
                const idx = uploadedData.headers.indexOf(col)
                const samples = getSampleValues(uploadedData, idx)
                return (
                  <button
                    key={col}
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50"
                    onClick={() => handleSelect(col)}
                  >
                    <span className="flex-1 truncate font-medium text-[#1E2A3A]">{col}</span>
                    <span className="shrink-0 text-xs text-slate-400">
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

// ─── 메인 페이지 ─────────────────────────────────
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
  const [selectedVarId, setSelectedVarId] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState("")
  const [toast, setToast] = useState<{ message: string; sub: string } | null>(null)

  // 선택된 변수가 삭제되면 선택 해제
  const selectedVar = latentVariables.find((v) => v.id === selectedVarId) ?? null
  useEffect(() => {
    if (selectedVarId && !selectedVar) setSelectedVarId(null)
  }, [selectedVarId, selectedVar])

  // 첫 변수 추가 시 자동 선택
  useEffect(() => {
    if (latentVariables.length === 1 && !selectedVarId) {
      setSelectedVarId(latentVariables[0].id)
    }
  }, [latentVariables, selectedVarId])

  // 할당 상태 계산
  const assignedColumns = new Set(
    latentVariables.flatMap((v) => v.items.map((i) => i.columnName))
  )
  const availableColumns = uploadedData
    ? uploadedData.headers.filter((h) => !assignedColumns.has(h))
    : []

  const totalItems = latentVariables.reduce((sum, v) => sum + v.items.length, 0)

  // 다음 단계 조건: 변수 2개 이상, 각 변수 문항 1개 이상
  const allVarsHaveItems = latentVariables.length >= 2 && latentVariables.every((v) => v.items.length > 0)

  function handleAddVariable() {
    const name = newVarName.trim()
    if (!name) return
    addLatentVariable(name, "blue")
    setNewVarName("")
    // 새로 추가된 변수를 자동 선택
    setTimeout(() => {
      const store = useProjectStore.getState()
      const latest = store.latentVariables[store.latentVariables.length - 1]
      if (latest) setSelectedVarId(latest.id)
    }, 0)
  }

  function handleAddManualItem() {
    const name = manualInput.trim()
    if (!name || !selectedVarId) return
    assignItemToVariable(selectedVarId, { columnName: name, sampleValues: [] })
    setManualInput("")
  }

  const handleNext = useCallback(() => {
    // 표본 크기 토스트 표시 후 다음 단계로 이동
    const { min, recommended } = calcSampleSize(latentVariables.length, totalItems)
    setToast({
      message: `SEM 기준 권장 표본: 최소 ${min}명 / 권장 ${recommended}명`,
      sub: `잠재변수 ${latentVariables.length}개, 문항 ${totalItems}개 기준`,
    })

    // 2초 후 이동
    setTimeout(() => {
      if (uploadedData) {
        router.push(`/projects/${projectId}/canvas`)
      } else {
        router.push(`/projects/${projectId}/survey/builder`)
      }
    }, 2000)
  }, [latentVariables, totalItems, uploadedData, projectId, router])

  // 다음 단계 버튼 비활성화 사유
  function getDisabledReason(): string | null {
    if (latentVariables.length < 2) return "변수를 2개 이상 추가하세요"
    const emptyVars = latentVariables.filter((v) => v.items.length === 0)
    if (emptyVars.length > 0) return `${emptyVars.map((v) => v.name).join(", ")}에 문항을 추가하세요`
    return null
  }
  const disabledReason = getDisabledReason()

  return (
    <div className="flex h-[calc(100vh-52px)] flex-col">
      {/* 2패널 레이아웃 */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── 좌측 패널: 변수 목록 (40%) ── */}
        <div className="flex w-[40%] flex-col border-r border-slate-200 bg-slate-50/50">
          {/* 변수 추가 입력 */}
          <div className="border-b border-slate-200 p-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              잠재변수 추가
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="변수명 (예: 직무만족)"
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddVariable()}
                className="h-9 bg-white text-sm"
              />
              <Button
                size="sm"
                onClick={handleAddVariable}
                disabled={!newVarName.trim()}
                className="h-9 shrink-0 px-3"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* 변수 칩 목록 */}
          <div className="flex-1 overflow-y-auto p-4">
            {latentVariables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Variable className="mb-3 size-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-400">변수를 추가하세요</p>
                <p className="mt-1 text-xs text-slate-400">
                  분석할 잠재변수를 위에서 입력합니다
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {latentVariables.map((v) => {
                  const isSelected = selectedVarId === v.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVarId(v.id)}
                      className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                        isSelected
                          ? "bg-[#1E2A3A] text-white shadow-sm"
                          : "bg-white text-[#1E2A3A] hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate font-medium">{v.name}</span>
                        <Badge
                          className={`shrink-0 text-[10px] ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : v.items.length === 0
                                ? "bg-amber-50 text-amber-600"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {v.items.length}개
                        </Badge>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeLatentVariable(v.id)
                        }}
                        className={`rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 ${
                          isSelected ? "text-white/60 hover:text-white" : "text-slate-300 hover:text-red-500"
                        }`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 하단 요약 */}
          <div className="border-t border-slate-200 px-4 py-3">
            <p className="text-xs text-slate-400">
              {latentVariables.length}개 변수 / {totalItems}개 문항
            </p>
          </div>
        </div>

        {/* ── 우측 패널: 문항 관리 (60%) ── */}
        <div className="flex w-[60%] flex-col bg-white">
          {selectedVar ? (
            <>
              {/* 선택된 변수 헤더 */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Input
                    value={selectedVar.name}
                    onChange={(e) =>
                      updateLatentVariable(selectedVar.id, { name: e.target.value })
                    }
                    className="h-8 w-48 border-none px-1 text-lg font-bold text-[#1E2A3A] shadow-none focus-visible:ring-1"
                  />
                  <Badge variant="outline" className="text-xs">
                    {selectedVar.items.length}개 문항
                  </Badge>
                </div>
              </div>

              {/* 문항 추가 영역 */}
              <div className="border-b border-slate-100 px-6 py-4">
                {uploadedData ? (
                  <ColumnDropdown
                    variableId={selectedVar.id}
                    availableColumns={availableColumns}
                    uploadedData={uploadedData}
                  />
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="문항 내용 입력 (예: 나는 직무에 만족한다)"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddManualItem()}
                      className="h-9 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 shrink-0"
                      onClick={handleAddManualItem}
                      disabled={!manualInput.trim()}
                    >
                      <Plus className="size-3.5" />
                      추가
                    </Button>
                  </div>
                )}
              </div>

              {/* 문항 목록 */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {selectedVar.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText className="mb-3 size-8 text-slate-200" />
                    <p className="text-sm text-slate-400">
                      {uploadedData
                        ? "위 드롭다운에서 컬럼을 선택하세요"
                        : "위에서 문항을 입력하세요"}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {selectedVar.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-2.5 text-sm transition-colors hover:bg-slate-50"
                      >
                        {/* 번호 */}
                        <span className="w-6 shrink-0 text-xs font-medium text-slate-400">
                          {idx + 1}
                        </span>

                        {/* 문항명 */}
                        <span className="flex-1 truncate font-medium text-[#1E2A3A]">
                          {item.columnName}
                        </span>

                        {/* 샘플 값 */}
                        {item.sampleValues.length > 0 && (
                          <span className="shrink-0 text-xs text-slate-400">
                            {item.sampleValues.slice(0, 2).join(", ")}
                          </span>
                        )}

                        {/* 역문항 토글 */}
                        <button
                          type="button"
                          onClick={() => toggleItemReverse(selectedVar.id, item.id)}
                          className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                            item.isReversed
                              ? "bg-orange-100 text-orange-600"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          }`}
                          title={item.isReversed ? "역문항 (클릭하여 해제)" : "정방향 (클릭하여 역문항 설정)"}
                        >
                          <RotateCcw className="size-3" />
                          {item.isReversed ? "R" : "정"}
                        </button>

                        {/* 삭제 */}
                        <button
                          type="button"
                          onClick={() => unassignItem(selectedVar.id, item.id)}
                          className="shrink-0 rounded p-0.5 text-slate-300 transition-colors hover:text-red-500"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            // 변수 미선택 상태
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <Variable className="mb-3 size-10 text-slate-200" />
              <p className="text-sm font-medium text-slate-400">
                좌측에서 변수를 선택하세요
              </p>
              <p className="mt-1 text-xs text-slate-400">
                변수를 클릭하면 문항을 관리할 수 있습니다
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── 하단 액션바 ── */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3">
        <p className="text-xs text-slate-400">
          {uploadedData
            ? `전체 컬럼 ${uploadedData.headers.length}개 중 ${assignedColumns.size}개 할당됨`
            : `${latentVariables.length}개 변수 · ${totalItems}개 문항`}
        </p>
        <div className="flex items-center gap-3">
          {disabledReason && (
            <span className="text-xs text-slate-400">{disabledReason}</span>
          )}
          <Button
            onClick={handleNext}
            disabled={!allVarsHaveItems}
            className="h-9"
          >
            다음 단계로
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* 표본 크기 토스트 */}
      {toast && (
        <Toast
          message={toast.message}
          sub={toast.sub}
          linkText="자세히 보기"
          linkHref={`/projects/${projectId}/sample-size`}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
