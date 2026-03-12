"use client"

import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Play, CheckCircle } from "lucide-react"
import AnalysisProgress, { type AnalysisStatus } from "@/components/analysis/AnalysisProgress"
import { formatFitMeasures, evaluateFit } from "@/components/canvas/AnalysisOverlay"
import { useProjectStore } from "@/lib/store/project-store"
import { buildCFAModel, buildSEMModel } from "@/lib/canvas/model-builder"
import type { LatentVariableNodeData } from "@/components/canvas/nodes/LatentVariableNode"

type AnalysisTab = 'measurement' | 'structural'

interface AnalysisResultData {
  fit_measures?: Record<string, number>
  parameters?: {
    lhs: string; op: string; rhs: string
    est: number; se: number; pvalue: number; 'std.all': number
    ci_lower?: number; ci_upper?: number
  }[]
  ave_cr?: { variable: string; ave: number; cr: number }[]
}

export default function AnalysisPage() {
  const params = useParams()
  const projectId = params.id as string

  const latentVariables = useProjectStore((s) => s.latentVariables)
  const canvasNodes = useProjectStore((s) => s.canvasNodes)
  const canvasEdges = useProjectStore((s) => s.canvasEdges)

  const [activeTab, setActiveTab] = useState<AnalysisTab>('measurement')
  const [cfaStatus, setCfaStatus] = useState<AnalysisStatus>('idle')
  const [semStatus, setSemStatus] = useState<AnalysisStatus>('idle')
  const [cfaResult, setCfaResult] = useState<AnalysisResultData | null>(null)
  const [semResult, setSemResult] = useState<AnalysisResultData | null>(null)
  const [cfaError, setCfaError] = useState<string | null>(null)
  const [semError, setSemError] = useState<string | null>(null)

  // 노드 데이터 맵 생성
  const nodeDataMap = useMemo(() => {
    const map = new Map<string, LatentVariableNodeData>()
    canvasNodes.forEach((n) => {
      if (n.type === "latentVariable") {
        map.set(n.id, n.data as LatentVariableNodeData)
      }
    })
    return map
  }, [canvasNodes])

  // 1단계: CFA 실행
  const runCFA = useCallback(async () => {
    setCfaStatus('running')
    setCfaError(null)

    try {
      const model = buildCFAModel(latentVariables)
      if (!model) throw new Error('잠재변수가 설정되지 않았습니다.')

      // 데이터 준비 (현재는 store의 uploadedData 사용)
      const uploadedData = useProjectStore.getState().uploadedData
      if (!uploadedData) throw new Error('업로드된 데이터가 없습니다.')

      // 컬럼명 → 데이터 배열 변환
      const data: Record<string, number[]> = {}
      uploadedData.headers.forEach((header, colIdx) => {
        data[header] = uploadedData.rows
          .map((row) => {
            const val = row[colIdx]
            return typeof val === 'number' ? val : Number(val)
          })
          .filter((v) => !isNaN(v))
      })

      const response = await fetch('/api/analyze/cfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, model }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'CFA 분석에 실패했습니다.')
      }

      setCfaResult(result)
      setCfaStatus('completed')
    } catch (error) {
      setCfaError(error instanceof Error ? error.message : '분석 중 오류 발생')
      setCfaStatus('failed')
    }
  }, [latentVariables])

  // 2단계: SEM 실행
  const runSEM = useCallback(async () => {
    setSemStatus('running')
    setSemError(null)

    try {
      const model = buildSEMModel(latentVariables, canvasEdges, nodeDataMap)
      if (!model) throw new Error('모델이 설정되지 않았습니다.')

      const uploadedData = useProjectStore.getState().uploadedData
      if (!uploadedData) throw new Error('업로드된 데이터가 없습니다.')

      const data: Record<string, number[]> = {}
      uploadedData.headers.forEach((header, colIdx) => {
        data[header] = uploadedData.rows
          .map((row) => {
            const val = row[colIdx]
            return typeof val === 'number' ? val : Number(val)
          })
          .filter((v) => !isNaN(v))
      })

      const response = await fetch('/api/analyze/sem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, model, bootstrap: 5000 }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'SEM 분석에 실패했습니다.')
      }

      setSemResult(result)
      setSemStatus('completed')
    } catch (error) {
      setSemError(error instanceof Error ? error.message : '분석 중 오류 발생')
      setSemStatus('failed')
    }
  }, [latentVariables, canvasEdges, nodeDataMap])

  const hasEdges = canvasEdges.length > 0

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
            <h1 className="text-xl font-bold">분석 결과</h1>
          </div>
        </div>
      </header>

      {/* 탭 */}
      <div className="border-b">
        <div className="mx-auto flex max-w-6xl px-6">
          <button
            type="button"
            onClick={() => setActiveTab('measurement')}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'measurement'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            1단계: 측정모형
            {cfaStatus === 'completed' && <CheckCircle className="ml-1.5 inline size-3.5 text-green-500" />}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('structural')}
            disabled={!hasEdges}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'structural'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            } ${!hasEdges ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            2단계: 구조모형
            {semStatus === 'completed' && <CheckCircle className="ml-1.5 inline size-3.5 text-green-500" />}
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* 1단계: 측정모형 */}
        {activeTab === 'measurement' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">측정모형 분석</h2>
                <p className="text-sm text-muted-foreground">
                  신뢰도, CFA, 타당성 분석을 수행합니다.
                </p>
              </div>
              <Button
                onClick={runCFA}
                disabled={cfaStatus === 'running' || latentVariables.length === 0}
              >
                <Play className="size-4" />
                {cfaStatus === 'completed' ? '재분석' : '분석 실행'}
              </Button>
            </div>

            <AnalysisProgress
              status={cfaStatus}
              step="CFA (확인적 요인분석) 실행 중"
              error={cfaError}
              onRetry={runCFA}
            />

            {/* CFA 결과 */}
            {cfaResult && (
              <div className="grid gap-4 md:grid-cols-2">
                {/* 모형적합도 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">모형적합도</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cfaResult.fit_measures && (
                      <>
                        <p className="mb-3 font-mono text-sm">
                          {formatFitMeasures(cfaResult.fit_measures)}
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {evaluateFit(cfaResult.fit_measures).details.map((d) => (
                            <div key={d.metric} className="flex items-center gap-2 text-sm">
                              <Badge
                                variant={
                                  d.status === 'good' ? 'default'
                                  : d.status === 'acceptable' ? 'secondary'
                                  : 'destructive'
                                }
                                className="w-16 justify-center"
                              >
                                {d.status === 'good' ? '양호' : d.status === 'acceptable' ? '수용' : '부적합'}
                              </Badge>
                              <span className="font-medium">{d.metric}</span>
                              <span className="font-mono text-muted-foreground">
                                {d.value.toFixed(3)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* AVE / CR */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">수렴·판별 타당도</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cfaResult.ave_cr && (
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground">
                          <span>변수</span>
                          <span>AVE</span>
                          <span>CR</span>
                          <span>판정</span>
                        </div>
                        {cfaResult.ave_cr.map((item) => (
                          <div key={item.variable} className="grid grid-cols-4 gap-2 text-sm">
                            <span className="font-medium">{item.variable}</span>
                            <span className={`font-mono ${item.ave < 0.5 ? 'text-orange-600 font-semibold' : ''}`}>
                              {item.ave.toFixed(3)}
                            </span>
                            <span className={`font-mono ${item.cr < 0.7 ? 'text-orange-600 font-semibold' : ''}`}>
                              {item.cr.toFixed(3)}
                            </span>
                            <Badge
                              variant={item.ave >= 0.5 && item.cr >= 0.7 ? 'default' : 'destructive'}
                              className="w-fit"
                            >
                              {item.ave >= 0.5 && item.cr >= 0.7 ? '충족' : '미달'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 요인적재량 테이블 */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">표준화 요인적재량</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cfaResult.parameters && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-xs text-muted-foreground">
                              <th className="pb-2 pr-4">잠재변수</th>
                              <th className="pb-2 pr-4">문항</th>
                              <th className="pb-2 pr-4">β (표준화)</th>
                              <th className="pb-2 pr-4">S.E.</th>
                              <th className="pb-2 pr-4">p</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cfaResult.parameters
                              .filter((p) => p.op === '=~')
                              .map((p, idx) => (
                                <tr key={idx} className="border-b last:border-0">
                                  <td className="py-1.5 pr-4 font-medium">{p.lhs}</td>
                                  <td className="py-1.5 pr-4">{p.rhs}</td>
                                  <td className="py-1.5 pr-4 font-mono">
                                    {p['std.all'].toFixed(3)}
                                  </td>
                                  <td className="py-1.5 pr-4 font-mono text-muted-foreground">
                                    {p.se.toFixed(3)}
                                  </td>
                                  <td className="py-1.5 pr-4 font-mono">
                                    {p.pvalue < 0.001 ? '<.001' : p.pvalue.toFixed(3)}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* 2단계: 구조모형 */}
        {activeTab === 'structural' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">구조모형 분석</h2>
                <p className="text-sm text-muted-foreground">
                  SEM 분석을 수행하고 경로계수를 확인합니다.
                </p>
              </div>
              <Button
                onClick={runSEM}
                disabled={semStatus === 'running' || !hasEdges}
              >
                <Play className="size-4" />
                {semStatus === 'completed' ? '재분석' : '분석 실행'}
              </Button>
            </div>

            <AnalysisProgress
              status={semStatus}
              step="SEM (구조방정식) 분석 중 — 부트스트랩 5,000회"
              error={semError}
              onRetry={runSEM}
            />

            {/* SEM 결과 */}
            {semResult && (
              <div className="grid gap-4 md:grid-cols-2">
                {/* 모형적합도 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">구조모형 적합도</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {semResult.fit_measures && (
                      <>
                        <p className="mb-3 font-mono text-sm">
                          {formatFitMeasures(semResult.fit_measures)}
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {evaluateFit(semResult.fit_measures).details.map((d) => (
                            <div key={d.metric} className="flex items-center gap-2 text-sm">
                              <Badge
                                variant={
                                  d.status === 'good' ? 'default'
                                  : d.status === 'acceptable' ? 'secondary'
                                  : 'destructive'
                                }
                                className="w-16 justify-center"
                              >
                                {d.status === 'good' ? '양호' : d.status === 'acceptable' ? '수용' : '부적합'}
                              </Badge>
                              <span className="font-medium">{d.metric}</span>
                              <span className="font-mono text-muted-foreground">
                                {d.value.toFixed(3)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* 경로계수 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">경로계수</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {semResult.parameters && (
                      <div className="flex flex-col gap-2">
                        {semResult.parameters
                          .filter((p) => p.op === '~')
                          .map((p, idx) => {
                            const sig = p.pvalue < 0.001 ? '***' : p.pvalue < 0.05 ? '*' : 'n.s.'
                            const sigColor = p.pvalue < 0.001
                              ? 'text-green-600' : p.pvalue < 0.05
                              ? 'text-yellow-600' : 'text-red-500'
                            return (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{p.rhs} → {p.lhs}</span>
                                <span className="ml-auto font-mono">
                                  β={p['std.all'].toFixed(3)}
                                </span>
                                <span className={`font-mono font-semibold ${sigColor}`}>
                                  {sig}
                                </span>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 하단 적합도 요약 바 (분석 결과 있을 때) */}
      {(cfaResult?.fit_measures || semResult?.fit_measures) && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2">
            <span className="font-mono text-sm">
              {formatFitMeasures(
                (activeTab === 'structural' && semResult?.fit_measures)
                  ? semResult.fit_measures
                  : cfaResult?.fit_measures ?? {}
              )}
            </span>
            <Badge
              variant={
                evaluateFit(
                  (activeTab === 'structural' && semResult?.fit_measures)
                    ? semResult.fit_measures
                    : cfaResult?.fit_measures ?? {}
                ).overall === 'good' ? 'default'
                : evaluateFit(
                    (activeTab === 'structural' && semResult?.fit_measures)
                      ? semResult.fit_measures
                      : cfaResult?.fit_measures ?? {}
                  ).overall === 'acceptable' ? 'secondary'
                : 'destructive'
              }
            >
              {evaluateFit(
                (activeTab === 'structural' && semResult?.fit_measures)
                  ? semResult.fit_measures
                  : cfaResult?.fit_measures ?? {}
              ).overall === 'good' ? '적합도 양호'
                : evaluateFit(
                    (activeTab === 'structural' && semResult?.fit_measures)
                      ? semResult.fit_measures
                      : cfaResult?.fit_measures ?? {}
                  ).overall === 'acceptable' ? '적합도 수용 가능'
                : '적합도 부적합'}
            </Badge>
          </div>
        </div>
      )}
    </div>
  )
}
