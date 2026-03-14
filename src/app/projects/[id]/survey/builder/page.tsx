"use client"

import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Plus, GripVertical, Trash2, RotateCcw, Minus, UserCircle, CheckCircle, Circle } from "lucide-react"
import { useProjectStore } from "@/lib/store/project-store"
import SurveySteps from "@/components/survey/SurveySteps"
import type { SurveyQuestion } from "@/types/survey"

type QuestionDraft = Omit<SurveyQuestion, 'id' | 'formId'> & { tempId: string }

// 페이지 구분선 마커 (문항 목록 내에 삽입되는 가상 항목)
interface PageBreak {
  type: "pageBreak"
  tempId: string
  afterPage: number // 이 구분선 이후 시작되는 페이지 번호
}

type ListItem = (QuestionDraft & { type?: undefined }) | PageBreak

// 인구통계 기본 템플릿
const DEMOGRAPHIC_TEMPLATE: Omit<QuestionDraft, 'tempId' | 'orderIndex' | 'pageNumber'>[] = [
  {
    questionText: "귀하의 성별은 무엇입니까?",
    questionType: "nominal",
    scaleMin: 1, scaleMax: 3,
    isReversed: false, isRequired: true,
  },
  {
    questionText: "귀하의 연령대는 어떻게 됩니까?",
    questionType: "ordinal",
    scaleMin: 1, scaleMax: 5,
    isReversed: false, isRequired: true,
  },
  {
    questionText: "귀하의 최종학력은 무엇입니까?",
    questionType: "ordinal",
    scaleMin: 1, scaleMax: 5,
    isReversed: false, isRequired: true,
  },
  {
    questionText: "귀하의 직급/직위는 무엇입니까?",
    questionType: "nominal",
    scaleMin: 1, scaleMax: 7,
    isReversed: false, isRequired: true,
  },
  {
    questionText: "귀하의 현 직장 근무연수는 어떻게 됩니까?",
    questionType: "ordinal",
    scaleMin: 1, scaleMax: 5,
    isReversed: false, isRequired: true,
  },
]

export default function SurveyBuilderPage() {
  const params = useParams()
  const projectId = params.id as string
  const latentVariables = useProjectStore((s) => s.latentVariables)

  // 문항 목록 (잠재변수에서 자동 생성)
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => {
    const initial: QuestionDraft[] = []
    latentVariables.forEach((lv) => {
      lv.items.forEach((item) => {
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

  // 페이지 구분선 목록
  const [pageBreaks, setPageBreaks] = useState<PageBreak[]>([])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const selectedQuestion = questions.find((q) => q.tempId === selectedId)

  // 페이지 정보 계산
  const pageInfo = useMemo(() => {
    // 구분선으로 페이지 번호 재계산
    const sortedBreaks = [...pageBreaks].sort((a, b) => {
      const aIdx = questions.findIndex((q) => q.tempId === a.tempId.replace('pb_after_', ''))
      const bIdx = questions.findIndex((q) => q.tempId === b.tempId.replace('pb_after_', ''))
      return aIdx - bIdx
    })
    const pageCount = sortedBreaks.length + 1
    return { pageCount }
  }, [pageBreaks, questions])

  // 현재 페이지 번호를 구분선 기반으로 계산
  const getPageNumber = useCallback((questionIndex: number): number => {
    let page = 1
    for (const pb of pageBreaks) {
      const breakAfterTempId = pb.tempId.replace('pb_after_', '')
      const breakIdx = questions.findIndex((q) => q.tempId === breakAfterTempId)
      if (breakIdx >= 0 && questionIndex > breakIdx) {
        page = pb.afterPage
      }
    }
    return page
  }, [pageBreaks, questions])

  // 페이지 구분선 추가 (문항 뒤에)
  const addPageBreak = useCallback((afterQuestionTempId: string) => {
    setPageBreaks((prev) => {
      // 이미 해당 위치에 구분선이 있으면 무시
      if (prev.some((pb) => pb.tempId === `pb_after_${afterQuestionTempId}`)) return prev
      const maxPage = prev.length > 0 ? Math.max(...prev.map((p) => p.afterPage)) : 1
      return [
        ...prev,
        {
          type: "pageBreak" as const,
          tempId: `pb_after_${afterQuestionTempId}`,
          afterPage: maxPage + 1,
        },
      ]
    })
  }, [])

  // 페이지 구분선 삭제
  const removePageBreak = useCallback((breakTempId: string) => {
    setPageBreaks((prev) => {
      const filtered = prev.filter((pb) => pb.tempId !== breakTempId)
      // 페이지 번호 재정렬
      return filtered.map((pb, idx) => ({ ...pb, afterPage: idx + 2 }))
    })
  }, [])

  // 인구통계 섹션 추가
  const addDemographicSection = useCallback(() => {
    const maxPage = pageBreaks.length > 0
      ? Math.max(...pageBreaks.map((p) => p.afterPage))
      : 1
    const demoPage = maxPage + 1

    // 마지막 문항의 tempId를 찾아서 그 뒤에 구분선 추가
    const lastQuestion = questions[questions.length - 1]

    setQuestions((prev) => {
      const newQuestions: QuestionDraft[] = DEMOGRAPHIC_TEMPLATE.map((tmpl, idx) => ({
        ...tmpl,
        tempId: `demo_${Date.now()}_${idx}`,
        orderIndex: prev.length + idx,
        pageNumber: demoPage,
      }))
      return [...prev, ...newQuestions]
    })

    // 구분선 추가
    if (lastQuestion) {
      setPageBreaks((prev) => [
        ...prev,
        {
          type: "pageBreak" as const,
          tempId: `pb_after_${lastQuestion.tempId}`,
          afterPage: demoPage,
        },
      ])
    }
  }, [questions, pageBreaks])

  // 문항 삭제
  const removeQuestion = useCallback((tempId: string) => {
    // 관련 구분선도 삭제
    setPageBreaks((prev) => prev.filter((pb) => pb.tempId !== `pb_after_${tempId}`))
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

  // 잠재변수 이름 조회
  const getVariableName = (variableId?: string) => {
    if (!variableId) return '인구통계'
    return latentVariables.find((v) => v.id === variableId)?.name ?? '미지정'
  }

  // 역문항 수
  const reversedCount = questions.filter((q) => q.isReversed).length
  // 인구통계 포함 여부
  const hasDemographic = questions.some((q) => !q.latentVariableId)
  // 총 페이지 수
  const totalPages = pageBreaks.length + 1

  // 렌더링: 문항을 페이지별로 묶어서 표시
  const renderList = useMemo(() => {
    const items: { type: "question" | "break"; question?: QuestionDraft; breakId?: string; pageLabel?: string }[] = []
    let currentPageNum = 1

    questions.forEach((q, idx) => {
      items.push({ type: "question", question: q })

      // 이 문항 뒤에 구분선이 있는지 확인
      const pb = pageBreaks.find((p) => p.tempId === `pb_after_${q.tempId}`)
      if (pb) {
        currentPageNum = pb.afterPage
        items.push({
          type: "break",
          breakId: pb.tempId,
          pageLabel: `${currentPageNum}페이지`,
        })
      }
    })
    return items
  }, [questions, pageBreaks])

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
          <SurveySteps current={1} />
          <Link href={`/projects/${projectId}/survey/deploy`}>
            <Button>
              다음: 설문 설정
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-[1fr_360px] gap-6">
          {/* 좌측: 문항 목록 */}
          <div className="flex flex-col gap-1">
            <div className="mb-2 text-xs font-medium text-muted-foreground">1페이지</div>

            {renderList.map((item) => {
              if (item.type === "break") {
                return (
                  <div
                    key={item.breakId}
                    className="my-2 flex items-center gap-2"
                  >
                    <div className="flex-1 border-t-2 border-dashed border-slate-300" />
                    <span className="shrink-0 rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      {item.pageLabel}
                    </span>
                    <div className="flex-1 border-t-2 border-dashed border-slate-300" />
                    <button
                      type="button"
                      onClick={() => removePageBreak(item.breakId!)}
                      className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                      title="구분선 삭제"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                )
              }

              const q = item.question!
              const globalIdx = questions.findIndex((qq) => qq.tempId === q.tempId)
              return (
                <div key={q.tempId}>
                  <div
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
                    {/* 구분선 삽입 버튼 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        addPageBreak(q.tempId)
                      }}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted"
                      title="여기에 페이지 구분선 추가"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeQuestion(q.tempId) }}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}

            {/* 인구통계 섹션 추가 */}
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={addDemographicSection}
                className="flex-1"
              >
                <UserCircle className="size-4" />
                인구통계 섹션 추가
              </Button>
            </div>

            {/* 문항 완성도 체크리스트 */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  문항 완성도 체크
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <CheckItem
                  checked={questions.length > 0}
                  label={`전체 문항 수: ${questions.length}개`}
                />
                <CheckItem
                  checked={totalPages >= 1}
                  label={`페이지 수: ${totalPages}페이지`}
                />
                <CheckItem
                  checked={hasDemographic}
                  label="인구통계 섹션 포함 여부"
                />
                <CheckItem
                  checked={reversedCount > 0}
                  label={`역문항 표시: ${reversedCount}개`}
                />
              </CardContent>
            </Card>
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

// 체크리스트 항목
function CheckItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {checked ? (
        <CheckCircle className="size-4 text-emerald-500" />
      ) : (
        <Circle className="size-4 text-slate-300" />
      )}
      <span className={checked ? "text-[#1E2A3A]" : "text-slate-400"}>{label}</span>
    </div>
  )
}
