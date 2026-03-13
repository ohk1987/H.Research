"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Play, CheckCircle, Sparkles } from "lucide-react"
import AnalysisProgress, { type AnalysisStatus } from "@/components/analysis/AnalysisProgress"
import { useProjectStore } from "@/lib/store/project-store"
import {
  interpretHLMNull,
  interpretHLMFixed,
} from "@/lib/interpretation/templates"
import type { HLMResult, HLMFixedEffect } from "@/types/analysis"

type HLMTab = "null" | "random_intercept" | "random_slope" | "cross_level"

const TAB_LABELS: Record<HLMTab, string> = {
  null: "Null 모델",
  random_intercept: "Random Intercept",
  random_slope: "Random Slope",
  cross_level: "교차수준 상호작용",
}

export default function HLMPage() {
  const params = useParams()
  const projectId = params.id as string

  const [activeTab, setActiveTab] = useState<HLMTab>("null")
  const [statuses, setStatuses] = useState<Record<HLMTab, AnalysisStatus>>({
    null: "idle",
    random_intercept: "idle",
    random_slope: "idle",
    cross_level: "idle",
  })
  const [results, setResults] = useState<Record<string, HLMResult | null>>({
    null: null,
    random_intercept: null,
    random_slope: null,
    cross_level: null,
  })
  const [errors, setErrors] = useState<Record<string, string | null>>({
    null: null,
    random_intercept: null,
    random_slope: null,
    cross_level: null,
  })
  const [interpretations, setInterpretations] = useState<Record<string, string | null>>({
    null: null,
    random_intercept: null,
    random_slope: null,
    cross_level: null,
  })

  // 변수 선택 상태
  const [outcome, setOutcome] = useState("")
  const [selectedLevel1, setSelectedLevel1] = useState<string[]>([])
  const [selectedLevel2, setSelectedLevel2] = useState<string[]>([])

  // 사용 가능한 변수 목록
  const uploadedData = useProjectStore((s) => s.uploadedData)
  const headers = uploadedData?.headers ?? []
  const groupVar = headers.find(
    (h) => h === "group_id" || h === "groupId" || h === "group"
  ) ?? "group_id"
  const numericVars = headers.filter((h) => h !== groupVar)

  // 데이터 준비 헬퍼
  const prepareData = useCallback(() => {
    if (!uploadedData) throw new Error("업로드된 데이터가 없습니다.")

    const data: Record<string, number[]> = {}
    uploadedData.headers.forEach((header, colIdx) => {
      data[header] = uploadedData.rows
        .map((row) => {
          const val = row[colIdx]
          return typeof val === "number" ? val : Number(val)
        })
        .filter((v) => !isNaN(v))
    })
    return data
  }, [uploadedData])

  // 분석 실행
  const runAnalysis = useCallback(async (modelType: HLMTab) => {
    setStatuses((prev) => ({ ...prev, [modelType]: "running" }))
    setErrors((prev) => ({ ...prev, [modelType]: null }))
    setInterpretations((prev) => ({ ...prev, [modelType]: null }))

    try {
      const data = prepareData()

      if (!outcome) throw new Error("결과변수를 선택하세요.")

      const body: Record<string, unknown> = {
        data,
        outcome,
        groupVar,
        modelType,
      }

      if (modelType !== "null") {
        if (selectedLevel1.length === 0) {
          throw new Error("Level 1 예측변수를 최소 1개 선택하세요.")
        }
        body.level1Preds = selectedLevel1
        body.level2Preds = selectedLevel2
      }

      const response = await fetch("/api/analyze/hlm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const result: HLMResult = await response.json()

      if (!result.success) {
        throw new Error(result.error || "HLM 분석에 실패했습니다.")
      }

      setResults((prev) => ({ ...prev, [modelType]: result }))
      setStatuses((prev) => ({ ...prev, [modelType]: "completed" }))
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [modelType]: err instanceof Error ? err.message : "분석 중 오류 발생",
      }))
      setStatuses((prev) => ({ ...prev, [modelType]: "failed" }))
    }
  }, [prepareData, outcome, groupVar, selectedLevel1, selectedLevel2])

  // 한국어 해석 생성
  const generateInterpretation = useCallback((modelType: HLMTab) => {
    const result = results[modelType]
    if (!result) return

    if (modelType === "null" && result.variance_components) {
      setInterpretations((prev) => ({
        ...prev,
        [modelType]: interpretHLMNull(
          result.icc,
          result.variance_components!.between,
          result.variance_components!.within
        ),
      }))
    } else if (result.fixed_effects) {
      const lines: string[] = []
      const fixedEffects = result.fixed_effects as Record<string, HLMFixedEffect>
      for (const [varName, effect] of Object.entries(fixedEffects)) {
        if (varName === "(Intercept)") continue
        lines.push(
          interpretHLMFixed(varName, outcome, effect.estimate, effect.se, effect.p)
        )
      }
      if (result.model_comparison) {
        const mc = result.model_comparison
        const sigText = mc.p < 0.05
          ? `Null 모델 대비 유의한 개선이 확인되었다(\u03C7\u00B2(${mc.df})=${mc.chi_sq.toFixed(3)}, p=${mc.p.toFixed(3)}).`
          : `Null 모델 대비 유의한 개선이 확인되지 않았다(\u03C7\u00B2(${mc.df})=${mc.chi_sq.toFixed(3)}, p=${mc.p.toFixed(3)}).`
        lines.push(sigText)
      }
      setInterpretations((prev) => ({
        ...prev,
        [modelType]: lines.join(" "),
      }))
    }
  }, [results, outcome])

  const nullResult = results.null
  const riResult = results.random_intercept

  // Level 1 변수 토글
  const toggleLevel1 = (v: string) => {
    setSelectedLevel1((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    )
  }

  const toggleLevel2 = (v: string) => {
    setSelectedLevel2((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 헤더 */}
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${projectId}/hlm-check`}>
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">다층분석 (HLM)</h1>
          </div>
        </div>
      </header>

      {/* 탭 */}
      <div className="border-b">
        <div className="mx-auto flex max-w-6xl px-6">
          {(Object.entries(TAB_LABELS) as [HLMTab, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              {statuses[key] === "completed" && (
                <CheckCircle className="ml-1.5 inline size-3.5 text-green-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* 변수 선택 영역 (공통) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">변수 설정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* 결과변수 */}
              <div>
                <label className="mb-1 block text-sm font-medium">결과변수 (Level 1)</label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">선택하세요</option>
                  {numericVars.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Level 1 예측변수 */}
              {activeTab !== "null" && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Level 1 예측변수</label>
                  <div className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-md border p-2">
                    {numericVars
                      .filter((v) => v !== outcome)
                      .map((v) => (
                        <label key={v} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedLevel1.includes(v)}
                            onChange={() => toggleLevel1(v)}
                            className="rounded"
                          />
                          {v}
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {/* Level 2 예측변수 */}
              {(activeTab === "cross_level") && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Level 2 예측변수</label>
                  <div className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-md border p-2">
                    {numericVars
                      .filter((v) => v !== outcome && !selectedLevel1.includes(v))
                      .map((v) => (
                        <label key={v} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedLevel2.includes(v)}
                            onChange={() => toggleLevel2(v)}
                            className="rounded"
                          />
                          {v}
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── 탭 1: Null 모델 ── */}
        {activeTab === "null" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Null 모델 (무조건 모형)</h2>
                <p className="text-sm text-muted-foreground">
                  예측변수 없이 ICC를 계산하여 다층모형 적용 타당성을 확인합니다.
                </p>
              </div>
              <Button
                onClick={() => runAnalysis("null")}
                disabled={statuses.null === "running" || !outcome}
              >
                <Play className="size-4" />
                {statuses.null === "completed" ? "재분석" : "분석 실행"}
              </Button>
            </div>

            <AnalysisProgress
              status={statuses.null}
              step="Null 모델 분석 중"
              error={errors.null}
              onRetry={() => runAnalysis("null")}
            />

            {nullResult && (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">ICC 결과</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 text-center">
                      <p className="text-4xl font-bold">{nullResult.icc.toFixed(3)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">ICC</p>
                    </div>
                    <p className="text-sm">
                      전체 분산의 <strong>{(nullResult.icc * 100).toFixed(1)}%</strong>가
                      집단 간 차이로 설명됩니다.
                    </p>
                    <div className="mt-3 rounded-lg bg-muted p-3">
                      <p className="text-xs font-medium text-muted-foreground">ICC 해석 가이드</p>
                      <div className="mt-1 flex flex-col gap-1 text-xs">
                        <span className={nullResult.icc < 0.05 ? "font-semibold" : ""}>
                          &lt; 0.05: 집단 효과 미미
                        </span>
                        <span className={nullResult.icc >= 0.05 && nullResult.icc < 0.20 ? "font-semibold" : ""}>
                          0.05~0.20: 중간 수준
                        </span>
                        <span className={nullResult.icc >= 0.20 ? "font-semibold" : ""}>
                          &gt; 0.20: 강한 집단 효과
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">분산 성분</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {nullResult.variance_components && (
                      <div className="flex flex-col gap-4">
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>집단 간 분산 (Between)</span>
                            <span className="font-mono">
                              {nullResult.variance_components.between.toFixed(3)}
                            </span>
                          </div>
                          <div className="mt-1 h-3 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{
                                width: `${nullResult.icc * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>집단 내 분산 (Within)</span>
                            <span className="font-mono">
                              {nullResult.variance_components.within.toFixed(3)}
                            </span>
                          </div>
                          <div className="mt-1 h-3 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-green-500"
                              style={{
                                width: `${(1 - nullResult.icc) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 해석 */}
            {nullResult && (
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => generateInterpretation("null")}
                >
                  <Sparkles className="size-4" />
                  한국어 해석 생성
                </Button>
                {interpretations.null && (
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm leading-relaxed">{interpretations.null}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 탭 2: Random Intercept ── */}
        {activeTab === "random_intercept" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Random Intercept 모델</h2>
                <p className="text-sm text-muted-foreground">
                  Level 1 예측변수의 고정효과를 추정하고 Null 모델과 비교합니다.
                </p>
              </div>
              <Button
                onClick={() => runAnalysis("random_intercept")}
                disabled={
                  statuses.random_intercept === "running" ||
                  !outcome ||
                  selectedLevel1.length === 0
                }
              >
                <Play className="size-4" />
                {statuses.random_intercept === "completed" ? "재분석" : "분석 실행"}
              </Button>
            </div>

            <AnalysisProgress
              status={statuses.random_intercept}
              step="Random Intercept 모델 분석 중"
              error={errors.random_intercept}
              onRetry={() => runAnalysis("random_intercept")}
            />

            {riResult && (
              <div className="grid gap-4 md:grid-cols-2">
                {/* 고정효과 테이블 */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">고정효과</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {riResult.fixed_effects && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-xs text-muted-foreground">
                              <th className="pb-2 pr-4">변수</th>
                              <th className="pb-2 pr-4">계수(b)</th>
                              <th className="pb-2 pr-4">SE</th>
                              <th className="pb-2 pr-4">t</th>
                              <th className="pb-2 pr-4">p</th>
                              <th className="pb-2 pr-4">유의</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(riResult.fixed_effects as Record<string, HLMFixedEffect>).map(
                              ([varName, effect]) => {
                                const sig = effect.p < 0.001
                                  ? "***"
                                  : effect.p < 0.01
                                    ? "**"
                                    : effect.p < 0.05
                                      ? "*"
                                      : "n.s."
                                const sigColor =
                                  effect.p < 0.001
                                    ? "text-green-600"
                                    : effect.p < 0.05
                                      ? "text-yellow-600"
                                      : "text-red-500"
                                return (
                                  <tr key={varName} className="border-b last:border-0">
                                    <td className="py-2 pr-4 font-medium">{varName}</td>
                                    <td className="py-2 pr-4 font-mono">{effect.estimate.toFixed(3)}</td>
                                    <td className="py-2 pr-4 font-mono text-muted-foreground">
                                      {effect.se.toFixed(3)}
                                    </td>
                                    <td className="py-2 pr-4 font-mono">{effect.t.toFixed(3)}</td>
                                    <td className="py-2 pr-4 font-mono">
                                      {effect.p < 0.001 ? "<.001" : effect.p.toFixed(3)}
                                    </td>
                                    <td className={`py-2 pr-4 font-mono font-semibold ${sigColor}`}>
                                      {sig}
                                    </td>
                                  </tr>
                                )
                              }
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 무선효과 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">무선효과 (분산 성분)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      ICC = {riResult.icc.toFixed(3)}
                    </p>
                    {riResult.aic && riResult.bic && (
                      <div className="mt-2 flex gap-4 text-sm">
                        <span>AIC: <strong className="font-mono">{riResult.aic.toFixed(1)}</strong></span>
                        <span>BIC: <strong className="font-mono">{riResult.bic.toFixed(1)}</strong></span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 모델 비교 */}
                {riResult.model_comparison && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Null 모델 대비 비교</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex justify-between">
                          <span>{"\u03C7\u00B2"}</span>
                          <span className="font-mono">{riResult.model_comparison.chi_sq.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>df</span>
                          <span className="font-mono">{riResult.model_comparison.df}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>p</span>
                          <span className="font-mono">
                            {riResult.model_comparison.p < 0.001
                              ? "<.001"
                              : riResult.model_comparison.p.toFixed(3)}
                          </span>
                        </div>
                        <Badge
                          variant={riResult.model_comparison.p < 0.05 ? "default" : "secondary"}
                          className="mt-1 w-fit"
                        >
                          {riResult.model_comparison.p < 0.05
                            ? "유의한 모델 개선"
                            : "유의한 차이 없음"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* 해석 */}
            {riResult && (
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => generateInterpretation("random_intercept")}
                >
                  <Sparkles className="size-4" />
                  한국어 해석 생성
                </Button>
                {interpretations.random_intercept && (
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm leading-relaxed">{interpretations.random_intercept}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 탭 3: Random Slope ── */}
        {activeTab === "random_slope" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Random Slope 모델</h2>
                <p className="text-sm text-muted-foreground">
                  예측변수의 기울기가 집단에 따라 달라지는지 확인합니다.
                </p>
              </div>
              <Button
                onClick={() => runAnalysis("random_slope")}
                disabled={
                  statuses.random_slope === "running" ||
                  !outcome ||
                  selectedLevel1.length === 0
                }
              >
                <Play className="size-4" />
                {statuses.random_slope === "completed" ? "재분석" : "분석 실행"}
              </Button>
            </div>

            <AnalysisProgress
              status={statuses.random_slope}
              step="Random Slope 모델 분석 중"
              error={errors.random_slope}
              onRetry={() => runAnalysis("random_slope")}
            />

            {results.random_slope && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">결과</CardTitle>
                </CardHeader>
                <CardContent>
                  {results.random_slope.fixed_effects && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs text-muted-foreground">
                            <th className="pb-2 pr-4">변수</th>
                            <th className="pb-2 pr-4">계수(b)</th>
                            <th className="pb-2 pr-4">SE</th>
                            <th className="pb-2 pr-4">t</th>
                            <th className="pb-2 pr-4">p</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(
                            results.random_slope.fixed_effects as Record<string, HLMFixedEffect>
                          ).map(([varName, effect]) => (
                            <tr key={varName} className="border-b last:border-0">
                              <td className="py-2 pr-4 font-medium">{varName}</td>
                              <td className="py-2 pr-4 font-mono">{effect.estimate.toFixed(3)}</td>
                              <td className="py-2 pr-4 font-mono">{effect.se.toFixed(3)}</td>
                              <td className="py-2 pr-4 font-mono">{effect.t.toFixed(3)}</td>
                              <td className="py-2 pr-4 font-mono">
                                {effect.p < 0.001 ? "<.001" : effect.p.toFixed(3)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {results.random_slope && (
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => generateInterpretation("random_slope")}
                >
                  <Sparkles className="size-4" />
                  한국어 해석 생성
                </Button>
                {interpretations.random_slope && (
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm leading-relaxed">{interpretations.random_slope}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 탭 4: 교차수준 상호작용 ── */}
        {activeTab === "cross_level" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">교차수준 상호작용</h2>
                <p className="text-sm text-muted-foreground">
                  Level 2 변수가 Level 1 관계를 조절하는지 검증합니다.
                </p>
              </div>
              <Button
                onClick={() => runAnalysis("cross_level")}
                disabled={
                  statuses.cross_level === "running" ||
                  !outcome ||
                  selectedLevel1.length === 0
                }
              >
                <Play className="size-4" />
                {statuses.cross_level === "completed" ? "재분석" : "분석 실행"}
              </Button>
            </div>

            <AnalysisProgress
              status={statuses.cross_level}
              step="교차수준 상호작용 분석 중"
              error={errors.cross_level}
              onRetry={() => runAnalysis("cross_level")}
            />

            {results.cross_level && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">교차수준 조절 효과</CardTitle>
                </CardHeader>
                <CardContent>
                  {results.cross_level.fixed_effects && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs text-muted-foreground">
                            <th className="pb-2 pr-4">변수</th>
                            <th className="pb-2 pr-4">계수(b)</th>
                            <th className="pb-2 pr-4">SE</th>
                            <th className="pb-2 pr-4">t</th>
                            <th className="pb-2 pr-4">p</th>
                            <th className="pb-2 pr-4">유의</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(
                            results.cross_level.fixed_effects as Record<string, HLMFixedEffect>
                          ).map(([varName, effect]) => {
                            const sig = effect.p < 0.05 ? "*" : "n.s."
                            return (
                              <tr key={varName} className="border-b last:border-0">
                                <td className="py-2 pr-4 font-medium">{varName}</td>
                                <td className="py-2 pr-4 font-mono">{effect.estimate.toFixed(3)}</td>
                                <td className="py-2 pr-4 font-mono">{effect.se.toFixed(3)}</td>
                                <td className="py-2 pr-4 font-mono">{effect.t.toFixed(3)}</td>
                                <td className="py-2 pr-4 font-mono">
                                  {effect.p < 0.001 ? "<.001" : effect.p.toFixed(3)}
                                </td>
                                <td className={`py-2 pr-4 font-semibold ${effect.p < 0.05 ? "text-green-600" : "text-red-500"}`}>
                                  {sig}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {results.cross_level && (
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => generateInterpretation("cross_level")}
                >
                  <Sparkles className="size-4" />
                  한국어 해석 생성
                </Button>
                {interpretations.cross_level && (
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm leading-relaxed">{interpretations.cross_level}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
