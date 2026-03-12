"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Plus, GripVertical, Trash2, RotateCcw } from "lucide-react"
import { useProjectStore } from "@/lib/store/project-store"
import type { SurveyQuestion } from "@/types/survey"

type QuestionDraft = Omit<SurveyQuestion, 'id' | 'formId'> & { tempId: string }

export default function SurveyBuilderPage() {
  const params = useParams()
  const projectId = params.id as string
  const latentVariables = useProjectStore((s) => s.latentVariables)

  // 문항 목록 (잠재변수에서 자동 생성)
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => {
    const initial: QuestionDraft[] = []
    latentVariables.forEach((lv) => {
      lv.items.forEach((item, idx) => {
        initial.push({
          tempId: `${lv.id}_${item.id}`,
          latentVariableId: lv.id,
          questionText: item.columnName,
          questionType: 'likert5',
          scaleMin: 1,
          scaleMax: 5,
          isReversed: item.isReversed,
          orderIndex: initial.length,
          pageNumber: 1,
          isRequired: true,
        })
      })
    })
    return initial
  })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const selectedQuestion = questions.find((q) => q.tempId === selectedId)

  // 문항 추가 (인구통계 섹션)
  const addDemographicQuestion = useCallback(() => {
    setQuestions((prev) => [
      ...prev,
      {
        tempId: `demo_${Date.now()}`,
        questionText: '새 인구통계 문항',
        questionType: 'nominal' as const,
        scaleMin: 1,
        scaleMax: 5,
        isReversed: false,
        orderIndex: prev.length,
        pageNumber: Math.max(1, ...prev.map((q) => q.pageNumber)) + 1,
        isRequired: true,
      },
    ])
  }, [])

  // 문항 삭제
  const removeQuestion = useCallback((tempId: string) => {
    setQuestions((prev) => {
      const filtered = prev.filter((q) => q.tempId !== tempId)
      return filtered.map((q, idx) => ({ ...q, orderIndex: idx }))
    })
    if (selectedId === tempId) setSelectedId(null)
  }, [selectedId])

  // 문항 수정
  const updateQuestion = useCallback((tempId: string, updates: Partial<QuestionDraft>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.tempId === tempId ? { ...q, ...updates } : q))
    )
  }, [])

  // 드래그 앤 드롭 순서 변경
  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return

    setQuestions((prev) => {
      const newList = [...prev]
      const [moved] = newList.splice(dragIdx, 1)
      newList.splice(idx, 0, moved)
      return newList.map((q, i) => ({ ...q, orderIndex: i }))
    })
    setDragIdx(idx)
  }, [dragIdx])

  const handleDragEnd = useCallback(() => {
    setDragIdx(null)
  }, [])

  // 페이지 구분선 추가
  const addPageBreak = useCallback((afterIdx: number) => {
    setQuestions((prev) => {
      const currentPage = prev[afterIdx]?.pageNumber ?? 1
      return prev.map((q, i) => ({
        ...q,
        pageNumber: i > afterIdx ? currentPage + 1 : q.pageNumber,
      }))
    })
  }, [])

  // 잠재변수 이름 조회
  const getVariableName = (variableId?: string) => {
    if (!variableId) return '인구통계'
    return latentVariables.find((v) => v.id === variableId)?.name ?? '미지정'
  }

  // 문항을 잠재변수별로 그루핑
  const groupedByPage = questions.reduce<Record<number, QuestionDraft[]>>((acc, q) => {
    if (!acc[q.pageNumber]) acc[q.pageNumber] = []
    acc[q.pageNumber].push(q)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 헤더 */}
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${projectId}/variables`}>
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">설문 빌더</h1>
          </div>
          <div className="flex gap-2">
            <Link href={`/projects/${projectId}/survey/deploy`}>
              <Button>
                배포 설정으로
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-[1fr_360px] gap-6">
          {/* 좌측: 문항 목록 */}
          <div className="flex flex-col gap-4">
            {Object.entries(groupedByPage)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([page, pageQuestions]) => (
                <div key={page}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      페이지 {page}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    {pageQuestions.map((q, localIdx) => {
                      const globalIdx = questions.findIndex((qq) => qq.tempId === q.tempId)
                      return (
                        <div
                          key={q.tempId}
                          draggable
                          onDragStart={() => handleDragStart(globalIdx)}
                          onDragOver={(e) => handleDragOver(e, globalIdx)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelectedId(q.tempId)}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors ${
                            selectedId === q.tempId
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted/50'
                          } ${dragIdx === globalIdx ? 'opacity-50' : ''}`}
                        >
                          <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">
                                Q{q.orderIndex + 1}
                              </span>
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                {getVariableName(q.latentVariableId)}
                              </span>
                              {q.isReversed && (
                                <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                                  <RotateCcw className="size-2.5" /> 역문항
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-sm">{q.questionText}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeQuestion(q.tempId) }}
                            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* 페이지 구분선 추가 버튼 */}
                  <button
                    type="button"
                    onClick={() => addPageBreak(questions.findIndex((qq) => qq.tempId === pageQuestions[pageQuestions.length - 1]?.tempId))}
                    className="mt-2 w-full rounded border border-dashed py-1 text-xs text-muted-foreground hover:bg-muted/50"
                  >
                    + 페이지 구분선
                  </button>
                </div>
              ))}

            {/* 인구통계 섹션 추가 */}
            <Button
              variant="outline"
              onClick={addDemographicQuestion}
              className="w-full"
            >
              <Plus className="size-4" />
              인구통계 섹션 추가
            </Button>
          </div>

          {/* 우측: 문항 편집 */}
          <div className="sticky top-4">
            {selectedQuestion ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">문항 편집</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {/* 문항 텍스트 */}
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">문항 텍스트</span>
                    <textarea
                      className="min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm"
                      value={selectedQuestion.questionText}
                      onChange={(e) => updateQuestion(selectedQuestion.tempId, { questionText: e.target.value })}
                    />
                  </label>

                  {/* 척도 유형 */}
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">척도 유형</span>
                    <select
                      className="rounded-md border bg-background px-3 py-1.5 text-sm"
                      value={selectedQuestion.questionType}
                      onChange={(e) => {
                        const type = e.target.value as SurveyQuestion['questionType']
                        const scaleUpdates: Partial<QuestionDraft> = { questionType: type }
                        if (type === 'likert5') { scaleUpdates.scaleMin = 1; scaleUpdates.scaleMax = 5 }
                        if (type === 'likert7') { scaleUpdates.scaleMin = 1; scaleUpdates.scaleMax = 7 }
                        updateQuestion(selectedQuestion.tempId, scaleUpdates)
                      }}
                    >
                      <option value="likert5">리커트 5점</option>
                      <option value="likert7">리커트 7점</option>
                      <option value="nominal">명목 척도</option>
                      <option value="ordinal">서열 척도</option>
                      <option value="text">주관식</option>
                    </select>
                  </label>

                  {/* 역문항 토글 */}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedQuestion.isReversed}
                      onChange={(e) => updateQuestion(selectedQuestion.tempId, { isReversed: e.target.checked })}
                      className="size-4 rounded border"
                    />
                    <span className="text-sm">역문항</span>
                  </label>

                  {/* 필수 응답 */}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedQuestion.isRequired}
                      onChange={(e) => updateQuestion(selectedQuestion.tempId, { isRequired: e.target.checked })}
                      className="size-4 rounded border"
                    />
                    <span className="text-sm">필수 응답</span>
                  </label>

                  {/* 페이지 번호 */}
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">페이지 번호</span>
                    <input
                      type="number"
                      min={1}
                      className="rounded-md border bg-background px-3 py-1.5 text-sm"
                      value={selectedQuestion.pageNumber}
                      onChange={(e) => updateQuestion(selectedQuestion.tempId, { pageNumber: Number(e.target.value) })}
                    />
                  </label>

                  {/* 소속 잠재변수 */}
                  <div className="rounded-md bg-muted/50 px-3 py-2">
                    <span className="text-xs text-muted-foreground">소속 잠재변수</span>
                    <p className="mt-0.5 text-sm font-medium">
                      {getVariableName(selectedQuestion.latentVariableId)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <p className="text-sm text-muted-foreground">
                    좌측에서 문항을 선택하면 여기서 편집할 수 있습니다.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
