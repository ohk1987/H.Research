"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Download, AlertTriangle, Info, Inbox, Copy, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useProjectStore } from "@/lib/store/project-store"
import SurveySteps from "@/components/survey/SurveySteps"

interface QuestionMeta {
  id: string
  questionText: string
  orderIndex: number
  isReversed: boolean
  latentVariableId?: string
}

interface ResponseRow {
  responseNumber: number
  completedAt: string
  groupName?: string
  values: (number | string | null)[]
}

interface ColumnWarning {
  column: string
  type: "missing" | "variance" | "normality"
  message: string
}

export default function SurveyDataPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const formId = projectId // 임시

  const [questions, setQuestions] = useState<QuestionMeta[]>([])
  const [rows, setRows] = useState<ResponseRow[]>([])
  const [hasGroups, setHasGroups] = useState(false)
  const [warnings, setWarnings] = useState<ColumnWarning[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // 데이터 로드
  const loadData = useCallback(async () => {
    const supabase = createClient()

    try {
      // 문항 조회
      const { data: questionData } = await supabase
        .from("survey_questions")
        .select("id, question_text, order_index, is_reversed, latent_variable_id")
        .eq("form_id", formId)
        .order("order_index")

      const qs: QuestionMeta[] = (questionData ?? []).map((q) => ({
        id: q.id as string,
        questionText: q.question_text as string,
        orderIndex: q.order_index as number,
        isReversed: q.is_reversed as boolean,
        latentVariableId: q.latent_variable_id as string | undefined,
      }))
      setQuestions(qs)

      // 완료된 응답 + 응답 항목 조회
      const { data: responses } = await supabase
        .from("survey_responses")
        .select(`
          id,
          group_id,
          completed_at,
          survey_response_items (
            question_id,
            value_numeric,
            value_text
          )
        `)
        .eq("form_id", formId)
        .eq("is_complete", true)
        .order("completed_at")

      // 그룹 정보
      const { data: groups } = await supabase
        .from("survey_groups")
        .select("id, name")
        .eq("form_id", formId)

      const groupMap = new Map<string, string>()
      ;(groups ?? []).forEach((g) => groupMap.set(g.id as string, g.name as string))
      const hasGroupLinks = groupMap.size > 0
      setHasGroups(hasGroupLinks)

      // 행 데이터 구성
      const dataRows: ResponseRow[] = (responses ?? []).map((r, idx) => {
        const itemMap = new Map<string, { value_numeric: number | null; value_text: string | null }>()
        ;(r.survey_response_items as { question_id: string; value_numeric: number | null; value_text: string | null }[])
          ?.forEach((item) => {
            itemMap.set(item.question_id, item)
          })

        const values: (number | string | null)[] = qs.map((q) => {
          const item = itemMap.get(q.id)
          if (!item) return null
          return item.value_numeric ?? item.value_text ?? null
        })

        return {
          responseNumber: idx + 1,
          completedAt: r.completed_at
            ? new Date(r.completed_at as string).toLocaleString("ko-KR", {
                month: "2-digit", day: "2-digit",
                hour: "2-digit", minute: "2-digit",
              })
            : "-",
          groupName: r.group_id ? groupMap.get(r.group_id as string) : undefined,
          values,
        }
      })
      setRows(dataRows)

      // 데이터 품질 경고 계산
      const colWarnings: ColumnWarning[] = []
      if (dataRows.length > 0) {
        qs.forEach((q, colIdx) => {
          const colValues = dataRows.map((r) => r.values[colIdx])
          const missing = colValues.filter((v) => v === null).length
          const missingRate = missing / dataRows.length

          // 결측치 > 10%
          if (missingRate > 0.1) {
            colWarnings.push({
              column: `Q${q.orderIndex + 1}`,
              type: "missing",
              message: `결측치 ${(missingRate * 100).toFixed(1)}% (기준: 10%)`,
            })
          }

          // 분산 = 0
          const numericValues = colValues.filter((v): v is number => typeof v === "number")
          if (numericValues.length > 1) {
            const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length
            const variance = numericValues.reduce((a, b) => a + (b - mean) ** 2, 0) / numericValues.length
            if (variance === 0) {
              colWarnings.push({
                column: `Q${q.orderIndex + 1}`,
                type: "variance",
                message: "분산이 0입니다 (모든 응답이 동일)",
              })
            }

            // 정규성 의심 (왜도 > 2)
            if (numericValues.length >= 30) {
              const sd = Math.sqrt(variance)
              if (sd > 0) {
                const skewness = numericValues.reduce((a, b) => a + ((b - mean) / sd) ** 3, 0) / numericValues.length
                if (Math.abs(skewness) > 2) {
                  colWarnings.push({
                    column: `Q${q.orderIndex + 1}`,
                    type: "normality",
                    message: `왜도 ${skewness.toFixed(2)} (정규성 위반 의심)`,
                  })
                }
              }
            }
          }
        })
      }
      setWarnings(colWarnings)
    } catch {
      // DB 연결 실패 시 빈 상태
    } finally {
      setLoading(false)
    }
  }, [formId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 분석 시작
  const handleStartAnalysis = useCallback(() => {
    setConnecting(true)
    const uploadedData = useProjectStore.getState().uploadedData
    const rowCount = uploadedData?.rowCount ?? rows.length
    setTimeout(() => {
      setConnecting(false)
      router.push(`/projects/${projectId}/canvas`)
    }, 300)
  }, [rows.length, projectId, router])

  // 링크 복사
  const handleCopyLink = useCallback(async () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const url = `${baseUrl}/survey/${formId}`
    await navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }, [formId])

  // Excel 다운로드
  const handleDownload = useCallback(() => {
    if (rows.length === 0 || questions.length === 0) return

    const headers = [
      "번호", "완료시각",
      ...(hasGroups ? ["그룹"] : []),
      ...questions.map((q) => `Q${q.orderIndex + 1}${q.isReversed ? "(R)" : ""}`),
    ]

    const csvRows = rows.map((r) => [
      r.responseNumber,
      r.completedAt,
      ...(hasGroups ? [r.groupName ?? ""] : []),
      ...r.values.map((v) => (v === null ? "" : String(v))),
    ])

    const csv = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n")
    const bom = "\uFEFF"
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `survey_responses_${formId}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }, [rows, questions, hasGroups, formId])

  // 전체 결측치 비율
  const totalCells = rows.length * questions.length
  const totalMissing = rows.reduce(
    (acc, r) => acc + r.values.filter((v) => v === null).length, 0
  )
  const missingRate = totalCells > 0 ? ((totalMissing / totalCells) * 100).toFixed(1) : "0"

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Link href={`/projects/${projectId}/survey/dashboard`}>
                <Button variant="ghost" size="icon-sm"><ArrowLeft className="size-4" /></Button>
              </Link>
              <h1 className="text-xl font-bold">응답 데이터</h1>
            </div>
            <SurveySteps current={4} />
            <div />
          </div>
        </header>
        <main className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">데이터를 불러오는 중...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${projectId}/survey/dashboard`}>
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">응답 데이터</h1>
          </div>
          <SurveySteps current={4} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} disabled={rows.length === 0}>
              <Download className="size-4" />
              Excel 다운로드
            </Button>
            <Button onClick={handleStartAnalysis} disabled={connecting || rows.length === 0}>
              {connecting ? "연결 중..." : (
                <>
                  분석 시작
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* 빈 상태 */}
        {rows.length === 0 && questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Inbox className="mb-3 size-12 text-slate-200" />
            <h3 className="text-base font-semibold text-[#1E2A3A]">아직 응답이 없습니다</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              수집 링크를 공유해보세요.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleCopyLink}
            >
              {copiedLink ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
              {copiedLink ? "복사됨" : "수집 링크 복사"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* 상단 요약 바 */}
            <div className="flex items-center gap-6 rounded-lg border bg-slate-50/50 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">전체</span>
                <span className="text-sm font-semibold text-[#1E2A3A]">{rows.length}행</span>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">변수</span>
                <span className="text-sm font-semibold text-[#1E2A3A]">{questions.length}개</span>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">결측치</span>
                <span className={`text-sm font-semibold ${
                  Number(missingRate) > 10 ? "text-red-500" : "text-[#1E2A3A]"
                }`}>
                  {missingRate}%
                </span>
              </div>
            </div>

            {/* 데이터 품질 경고 */}
            {warnings.length > 0 && (
              <div className="flex flex-col gap-2">
                {warnings.filter((w) => w.type === "missing" || w.type === "variance").map((w, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
                    <AlertTriangle className="size-4 shrink-0 text-amber-500" />
                    <span className="text-xs text-amber-700">
                      {w.column}: {w.message}
                    </span>
                  </div>
                ))}
                {warnings.filter((w) => w.type === "normality").map((w, i) => (
                  <div key={`n-${i}`} className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
                    <Info className="size-4 shrink-0 text-blue-500" />
                    <span className="text-xs text-blue-700">
                      {w.column}: {w.message}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 전체 응답 테이블 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">전체 응답 데이터</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-xs">
                    <thead className="sticky top-0 z-10 bg-white">
                      <tr className="border-b">
                        <th className="sticky left-0 z-20 bg-white px-3 py-2.5 text-left font-medium text-slate-500">
                          #
                        </th>
                        <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                          완료 시각
                        </th>
                        {hasGroups && (
                          <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                            그룹
                          </th>
                        )}
                        {questions.map((q) => (
                          <th
                            key={q.id}
                            className="px-3 py-2.5 text-center font-medium text-slate-500"
                            title={q.questionText}
                          >
                            <span className="flex items-center justify-center gap-1">
                              Q{q.orderIndex + 1}
                              {q.isReversed && (
                                <span className="rounded bg-amber-100 px-1 text-[9px] font-semibold text-amber-600">
                                  R
                                </span>
                              )}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.responseNumber} className="border-b last:border-0 hover:bg-slate-50/50">
                          <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-[#1E2A3A]">
                            {row.responseNumber}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                            {row.completedAt}
                          </td>
                          {hasGroups && (
                            <td className="px-3 py-2 text-slate-500">
                              {row.groupName ?? "-"}
                            </td>
                          )}
                          {row.values.map((val, ci) => (
                            <td
                              key={ci}
                              className={`px-3 py-2 text-center ${
                                val === null
                                  ? "bg-red-50 text-red-300"
                                  : "text-[#1E2A3A]"
                              }`}
                            >
                              {val === null ? "-" : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
