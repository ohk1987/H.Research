"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Play, Loader2 } from "lucide-react"
import { useProjectStore } from "@/lib/store/project-store"
import APATable from "@/components/results/APATable"
import InterpretationBlock from "@/components/results/InterpretationBlock"
import {
  interpretTTest,
  interpretANOVA,
  interpretCorrelation,
  interpretCrosstab,
} from "@/lib/interpretation/templates"

type AnalysisType = 'ttest' | 'anova' | 'correlation' | 'crosstab'

interface AnalysisConfig {
  type: AnalysisType
  dv: string
  group: string
  var1: string
  var2: string
  variables: string[]
  method: 'pearson' | 'spearman'
}

export default function BasicAnalysisPage() {
  const params = useParams()
  const projectId = params.id as string
  const projectName = useProjectStore((s) => s.projectName) || '연구 프로젝트'
  const uploadedData = useProjectStore((s) => s.uploadedData)

  const [analysisType, setAnalysisType] = useState<AnalysisType>('ttest')
  const [config, setConfig] = useState<Partial<AnalysisConfig>>({
    method: 'pearson',
  })
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [interpretation, setInterpretation] = useState<string>('')
  const [error, setError] = useState<string>('')

  // 사용 가능한 변수 목록
  const availableVariables = uploadedData?.headers ?? []

  const handleRun = useCallback(async () => {
    setRunning(true)
    setError('')
    setResult(null)
    setInterpretation('')

    try {
      // 데이터 준비
      const data: Record<string, unknown[]> = {}
      if (uploadedData) {
        uploadedData.headers.forEach((header, idx) => {
          data[header] = uploadedData.rows.map((row) => row[idx])
        })
      }

      let endpoint = ''
      let body: Record<string, unknown> = { data }

      switch (analysisType) {
        case 'ttest':
          endpoint = '/api/analyze/ttest'
          body = { ...body, dv: config.dv, group: config.group }
          break
        case 'anova':
          endpoint = '/api/analyze/anova'
          body = { ...body, dv: config.dv, group: config.group }
          break
        case 'correlation':
          endpoint = '/api/analyze/correlation'
          body = { ...body, method: config.method ?? 'pearson' }
          break
        case 'crosstab':
          endpoint = '/api/analyze/crosstab'
          body = { ...body, var1: config.var1, var2: config.var2 }
          break
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!json.success) {
        setError(json.error || '분석 중 오류가 발생했습니다.')
        return
      }

      setResult(json)

      // 해석 생성
      switch (analysisType) {
        case 'ttest':
          setInterpretation(
            interpretTTest(
              config.dv ?? '',
              Object.keys(json.means)[0] ?? '',
              Object.keys(json.means)[1] ?? '',
              json.t, json.df, json.p, json.cohen_d, json.means
            )
          )
          break
        case 'anova':
          setInterpretation(
            interpretANOVA(
              config.dv ?? '', config.group ?? '',
              json.f, json.df1, json.df2, json.p, json.eta_squared
            )
          )
          break
        case 'correlation': {
          const corr = json.correlation as Record<string, Record<string, number>>
          const pVals = json.p_values as Record<string, Record<string, number>>
          const vars = Object.keys(corr)
          const lines: string[] = []
          for (let i = 0; i < vars.length; i++) {
            for (let j = i + 1; j < vars.length; j++) {
              lines.push(
                interpretCorrelation(vars[i], vars[j], corr[vars[i]][vars[j]], pVals[vars[i]][vars[j]])
              )
            }
          }
          setInterpretation(lines.join('\n'))
          break
        }
        case 'crosstab':
          setInterpretation(
            interpretCrosstab(
              config.var1 ?? '', config.var2 ?? '',
              json.chi_squared, json.df, json.p, json.cramers_v
            )
          )
          break
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.')
    } finally {
      setRunning(false)
    }
  }, [analysisType, config, uploadedData])

  const analysisTypes = [
    { key: 'ttest' as const, label: '독립표본 t-검정' },
    { key: 'anova' as const, label: '일원분산분석 (ANOVA)' },
    { key: 'correlation' as const, label: '상관분석' },
    { key: 'crosstab' as const, label: '교차분석 (χ²)' },
  ]

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 헤더 */}
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${projectId}/canvas`}>
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">기본 분석</h1>
              <p className="text-sm text-muted-foreground">{projectName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid grid-cols-[280px_1fr] gap-6">
          {/* 좌측: 분석 설정 */}
          <div className="flex flex-col gap-4">
            {/* 분석 유형 선택 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">분석 유형</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {analysisTypes.map((type) => (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => {
                      setAnalysisType(type.key)
                      setResult(null)
                      setInterpretation('')
                      setError('')
                    }}
                    className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      analysisType === type.key
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* 변수 설정 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">변수 설정</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {(analysisType === 'ttest' || analysisType === 'anova') && (
                  <>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">종속변수</span>
                      <select
                        className="rounded-md border bg-background px-3 py-1.5 text-sm"
                        value={config.dv ?? ''}
                        onChange={(e) => setConfig({ ...config, dv: e.target.value })}
                      >
                        <option value="">선택...</option>
                        {availableVariables.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">집단변수</span>
                      <select
                        className="rounded-md border bg-background px-3 py-1.5 text-sm"
                        value={config.group ?? ''}
                        onChange={(e) => setConfig({ ...config, group: e.target.value })}
                      >
                        <option value="">선택...</option>
                        {availableVariables.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                  </>
                )}

                {analysisType === 'correlation' && (
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">상관계수 유형</span>
                    <select
                      className="rounded-md border bg-background px-3 py-1.5 text-sm"
                      value={config.method ?? 'pearson'}
                      onChange={(e) => setConfig({ ...config, method: e.target.value as 'pearson' | 'spearman' })}
                    >
                      <option value="pearson">Pearson</option>
                      <option value="spearman">Spearman</option>
                    </select>
                  </label>
                )}

                {analysisType === 'crosstab' && (
                  <>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">행 변수</span>
                      <select
                        className="rounded-md border bg-background px-3 py-1.5 text-sm"
                        value={config.var1 ?? ''}
                        onChange={(e) => setConfig({ ...config, var1: e.target.value })}
                      >
                        <option value="">선택...</option>
                        {availableVariables.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">열 변수</span>
                      <select
                        className="rounded-md border bg-background px-3 py-1.5 text-sm"
                        value={config.var2 ?? ''}
                        onChange={(e) => setConfig({ ...config, var2: e.target.value })}
                      >
                        <option value="">선택...</option>
                        {availableVariables.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                  </>
                )}

                <Button
                  onClick={handleRun}
                  disabled={running}
                  className="mt-2 w-full"
                >
                  {running ? (
                    <><Loader2 className="size-4 animate-spin" /> 분석 중...</>
                  ) : (
                    <><Play className="size-4" /> 분석 실행</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 우측: 결과 */}
          <div className="flex flex-col gap-6">
            {error && (
              <Card className="border-destructive">
                <CardContent className="py-4">
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {!result && !error && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <p className="text-muted-foreground">
                    좌측에서 분석 유형과 변수를 선택한 후 분석을 실행하세요.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* t-test 결과 */}
            {result && analysisType === 'ttest' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">독립표본 t-검정 결과</CardTitle>
                </CardHeader>
                <CardContent>
                  <APATable
                    title="Table. 독립표본 t-검정 결과"
                    headers={['통계량', '값']}
                    rows={[
                      ['t', (result as Record<string, number>).t],
                      ['df', (result as Record<string, number>).df],
                      ['p', (result as Record<string, number>).p],
                      ["Cohen's d", (result as Record<string, number>).cohen_d],
                    ]}
                  />
                </CardContent>
              </Card>
            )}

            {/* ANOVA 결과 */}
            {result && analysisType === 'anova' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">일원분산분석 결과</CardTitle>
                </CardHeader>
                <CardContent>
                  <APATable
                    title="Table. 일원분산분석 결과"
                    headers={['통계량', '값']}
                    rows={[
                      ['F', (result as Record<string, number>).f],
                      ['df1', (result as Record<string, number>).df1],
                      ['df2', (result as Record<string, number>).df2],
                      ['p', (result as Record<string, number>).p],
                      ['η²', (result as Record<string, number>).eta_squared],
                    ]}
                  />
                </CardContent>
              </Card>
            )}

            {/* 상관분석 결과 */}
            {result && analysisType === 'correlation' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">상관분석 결과</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 text-xs text-muted-foreground">
                    N = {(result as Record<string, number>).n}
                  </p>
                  {(() => {
                    const corr = (result as Record<string, Record<string, Record<string, number>>>).correlation
                    if (!corr) return null
                    const vars = Object.keys(corr)
                    return (
                      <APATable
                        title="Table. 상관행렬"
                        headers={['', ...vars]}
                        rows={vars.map((v) => [
                          v,
                          ...vars.map((v2) => corr[v]?.[v2]?.toFixed(3) ?? '-'),
                        ])}
                        note="*p<.05, **p<.01, ***p<.001"
                      />
                    )
                  })()}
                </CardContent>
              </Card>
            )}

            {/* 교차분석 결과 */}
            {result && analysisType === 'crosstab' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">교차분석 결과</CardTitle>
                </CardHeader>
                <CardContent>
                  <APATable
                    title="Table. 교차분석 결과"
                    headers={['통계량', '값']}
                    rows={[
                      ['χ²', (result as Record<string, number>).chi_squared],
                      ['df', (result as Record<string, number>).df],
                      ['p', (result as Record<string, number>).p],
                      ["Cramér's V", (result as Record<string, number>).cramers_v],
                    ]}
                  />
                </CardContent>
              </Card>
            )}

            {/* 해석 */}
            {interpretation && (
              <InterpretationBlock text={interpretation} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
