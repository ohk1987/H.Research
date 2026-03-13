"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, Play, AlertTriangle, Info } from "lucide-react"
import AnalysisProgress, { type AnalysisStatus } from "@/components/analysis/AnalysisProgress"
import { useProjectStore } from "@/lib/store/project-store"
import { interpretHLMPrerequisites } from "@/lib/interpretation/templates"
import type { HLMPrereqResult, HLMPrereqVariableResult } from "@/types/analysis"

export default function HLMCheckPage() {
  const params = useParams()
  const projectId = params.id as string

  const [status, setStatus] = useState<AnalysisStatus>("idle")
  const [result, setResult] = useState<HLMPrereqResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [interpretation, setInterpretation] = useState<string | null>(null)

  const runCheck = useCallback(async () => {
    setStatus("running")
    setError(null)
    setInterpretation(null)

    try {
      const uploadedData = useProjectStore.getState().uploadedData
      if (!uploadedData) throw new Error("업로드된 데이터가 없습니다.")

      // 데이터 변환
      const data: Record<string, number[]> = {}
      uploadedData.headers.forEach((header, colIdx) => {
        data[header] = uploadedData.rows
          .map((row) => {
            const val = row[colIdx]
            return typeof val === "number" ? val : Number(val)
          })
          .filter((v) => !isNaN(v))
      })

      // group_id 변수 확인
      const groupVar = uploadedData.headers.find(
        (h) => h === "group_id" || h === "groupId" || h === "group"
      )
      if (!groupVar) {
        throw new Error("집단변수(group_id)가 데이터에 없습니다. 설문 그룹링크로 수집된 데이터가 필요합니다.")
      }

      // 수치형 변수만 대상으로 선택
      const targetVars = uploadedData.headers.filter(
        (h) => h !== groupVar && data[h]?.length > 0
      )

      const response = await fetch("/api/analyze/hlm-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, groupVar, targetVars }),
      })

      const res = await response.json()

      if (!res.success) {
        throw new Error(res.error || "HLM 사전 검증에 실패했습니다.")
      }

      setResult(res)
      setStatus("completed")

      // 해석 생성
      const interpretations: string[] = []
      for (const [varName, varResult] of Object.entries(res.prerequisites as Record<string, HLMPrereqVariableResult>)) {
        if (!varResult.error) {
          interpretations.push(
            interpretHLMPrerequisites(varName, varResult.icc1, varResult.rwg_mean, varResult.n_groups)
          )
        }
      }
      setInterpretation(interpretations.join("\n\n"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 중 오류 발생")
      setStatus("failed")
    }
  }, [])

  // 집단 구조 요약 계산
  const groupSummary = result ? (() => {
    const firstVar = Object.values(result.prerequisites)[0] as HLMPrereqVariableResult | undefined
    if (!firstVar || firstVar.error) return null
    const nGroups = firstVar.n_groups
    const groupMeans = firstVar.group_means
    const totalResponses = Object.values(groupMeans).length > 0
      ? Object.keys(groupMeans).length
      : 0
    const uploadedData = useProjectStore.getState().uploadedData
    const totalN = uploadedData?.rows.length ?? 0
    const avgPerGroup = nGroups > 0 ? Math.round(totalN / nGroups) : 0
    return { totalN, nGroups, avgPerGroup }
  })() : null

  const hasWarnings = result && Object.values(result.prerequisites).some(
    (v) => {
      const vr = v as HLMPrereqVariableResult
      return !vr.error && (!vr.icc_adequate || !vr.rwg_adequate)
    }
  )

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${projectId}/canvas`}>
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">HLM 사전 검증</h1>
          </div>
          <Button
            onClick={runCheck}
            disabled={status === "running"}
          >
            <Play className="size-4" />
            {status === "completed" ? "재검증" : "검증 실행"}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-6">
          <AnalysisProgress
            status={status}
            step="ICC(1)·rwg 사전 검증 실행 중"
            error={error}
            onRetry={runCheck}
          />

          {/* 집단 구조 요약 */}
          {groupSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">집단 구조 요약</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{groupSummary.totalN}</p>
                    <p className="text-sm text-muted-foreground">전체 응답 수</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{groupSummary.nGroups}</p>
                    <p className="text-sm text-muted-foreground">집단 수</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{groupSummary.avgPerGroup}</p>
                    <p className="text-sm text-muted-foreground">집단당 평균 응답</p>
                  </div>
                </div>
                {groupSummary.nGroups < 30 && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-950">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-yellow-600" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      집단 수가 30개 미만입니다. HLM 적용 시 통계적 검정력이 낮을 수 있습니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ICC·rwg 테이블 */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">변수별 ICC·rwg 검증 결과</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-4">변수</th>
                        <th className="pb-2 pr-4">
                          <span className="inline-flex items-center gap-1">
                            ICC(1)
                            <span className="group relative">
                              <Info className="size-3 cursor-help" />
                              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-48 -translate-x-1/2 rounded bg-foreground px-2 py-1 text-xs text-background group-hover:block">
                                집단 간 분산 비율. 0.05 이상이면 집단 효과가 존재하여 HLM 적용 가능
                              </span>
                            </span>
                          </span>
                        </th>
                        <th className="pb-2 pr-4">
                          <span className="inline-flex items-center gap-1">
                            rwg 평균
                            <span className="group relative">
                              <Info className="size-3 cursor-help" />
                              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-48 -translate-x-1/2 rounded bg-foreground px-2 py-1 text-xs text-background group-hover:block">
                                집단 내 합의도. 0.70 이상이면 집단 내 합의가 충분하여 집단 수준 집계 가능
                              </span>
                            </span>
                          </span>
                        </th>
                        <th className="pb-2 pr-4">ICC 충족</th>
                        <th className="pb-2 pr-4">rwg 충족</th>
                        <th className="pb-2 pr-4">집계 가능</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(result.prerequisites).map(([varName, varResult]) => {
                        const vr = varResult as HLMPrereqVariableResult
                        if (vr.error) {
                          return (
                            <tr key={varName} className="border-b last:border-0">
                              <td className="py-2 pr-4 font-medium">{varName}</td>
                              <td colSpan={5} className="py-2 text-sm text-destructive">{vr.error}</td>
                            </tr>
                          )
                        }
                        const aggregatable = vr.icc_adequate && vr.rwg_adequate
                        return (
                          <tr key={varName} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">{varName}</td>
                            <td className="py-2 pr-4 font-mono">{vr.icc1.toFixed(3)}</td>
                            <td className="py-2 pr-4 font-mono">{vr.rwg_mean.toFixed(3)}</td>
                            <td className="py-2 pr-4">
                              <Badge variant={vr.icc_adequate ? "default" : "destructive"} className="w-8 justify-center">
                                {vr.icc_adequate ? "\u2705" : "\u26A0\uFE0F"}
                              </Badge>
                            </td>
                            <td className="py-2 pr-4">
                              <Badge variant={vr.rwg_adequate ? "default" : "destructive"} className="w-8 justify-center">
                                {vr.rwg_adequate ? "\u2705" : "\u26A0\uFE0F"}
                              </Badge>
                            </td>
                            <td className="py-2 pr-4">
                              <Badge variant={aggregatable ? "default" : "secondary"}>
                                {aggregatable ? "적합" : "검토 필요"}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 집단별 평균 시각화 (간단한 바 차트) */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">집단별 평균 비교</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  {Object.entries(result.prerequisites).slice(0, 3).map(([varName, varResult]) => {
                    const vr = varResult as HLMPrereqVariableResult
                    if (vr.error || !vr.group_means) return null
                    const means = Object.entries(vr.group_means)
                    const maxMean = Math.max(...means.map(([, m]) => m))
                    return (
                      <div key={varName}>
                        <p className="mb-2 text-sm font-medium">{varName}</p>
                        <div className="flex flex-col gap-1">
                          {means.map(([groupId, mean]) => (
                            <div key={groupId} className="flex items-center gap-2">
                              <span className="w-16 text-xs text-muted-foreground">G{groupId}</span>
                              <div className="flex-1">
                                <div
                                  className="h-5 rounded bg-primary/20"
                                  style={{ width: `${maxMean > 0 ? (mean / maxMean) * 100 : 0}%` }}
                                >
                                  <div className="h-full rounded bg-primary" style={{ width: "100%" }} />
                                </div>
                              </div>
                              <span className="w-12 text-right font-mono text-xs">{mean.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 한국어 해석 */}
          {interpretation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">한국어 해석</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {interpretation}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 하단: HLM 분석으로 진행 */}
          {status === "completed" && (
            <div className="flex items-center justify-end gap-3">
              {hasWarnings && (
                <p className="flex items-center gap-1 text-sm text-yellow-600">
                  <AlertTriangle className="size-4" />
                  일부 기준 미충족 변수가 있습니다. 진행 시 결과 해석에 주의하세요.
                </p>
              )}
              <Link href={`/projects/${projectId}/hlm`}>
                <Button>
                  HLM 분석으로 진행
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
