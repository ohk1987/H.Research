"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Calculator } from "lucide-react"
import { useProjectStore } from "@/lib/store/project-store"
import {
  calculateSEMSampleSize,
  calculateRegressionSampleSize,
  calculateTTestSampleSize,
  calculateANOVASampleSize,
  calculateCorrelationSampleSize,
} from "@/lib/utils/sample-size"

type AnalysisType = 'sem' | 'regression' | 'ttest' | 'anova' | 'correlation'
type EffectSize = 'small' | 'medium' | 'large'

export default function SampleSizePage() {
  const params = useParams()
  const projectId = params.id as string
  const latentVariables = useProjectStore((s) => s.latentVariables)

  const [analysisType, setAnalysisType] = useState<AnalysisType>('sem')
  const [effectSize, setEffectSize] = useState<EffectSize>('medium')
  const [power, setPower] = useState(0.8)
  const [nPredictors, setNPredictors] = useState(3)
  const [nGroups, setNGroups] = useState(3)
  const [expectedR, setExpectedR] = useState(0.3)
  const [targetN, setTargetN] = useState<number | ''>('')

  // 잠재변수/문항 수 자동 계산
  const nLatentVars = latentVariables.length
  const nItems = latentVariables.reduce((sum, v) => sum + v.items.length, 0)

  const result = useMemo(() => {
    switch (analysisType) {
      case 'sem': {
        const r = calculateSEMSampleSize(nLatentVars || 3, nItems || 15)
        return { minimum: r.minimum, recommended: r.recommended }
      }
      case 'regression': {
        const n = calculateRegressionSampleSize(nPredictors, effectSize, power)
        return { minimum: n, recommended: Math.ceil(n * 1.2) }
      }
      case 'ttest': {
        const n = calculateTTestSampleSize(effectSize, power)
        return { minimum: n, recommended: Math.ceil(n * 1.2) }
      }
      case 'anova': {
        const n = calculateANOVASampleSize(nGroups, effectSize, power)
        return { minimum: n, recommended: Math.ceil(n * 1.2) }
      }
      case 'correlation': {
        const n = calculateCorrelationSampleSize(expectedR, power)
        return { minimum: n, recommended: Math.ceil(n * 1.2) }
      }
    }
  }, [analysisType, effectSize, power, nLatentVars, nItems, nPredictors, nGroups, expectedR])

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center px-6 py-4">
          <Link href={`/projects/${projectId}/variables`}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="ml-3 text-xl font-bold">표본 크기 계산</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="grid grid-cols-[320px_1fr] gap-6">
          {/* 좌측: 설정 */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">분석 유형</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {([
                  { key: 'sem' as const, label: '구조방정식 (SEM)' },
                  { key: 'regression' as const, label: '회귀분석' },
                  { key: 'ttest' as const, label: '독립표본 t-검정' },
                  { key: 'anova' as const, label: 'ANOVA' },
                  { key: 'correlation' as const, label: '상관분석' },
                ]).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setAnalysisType(t.key)}
                    className={`rounded-md px-3 py-2 text-left text-sm ${
                      analysisType === t.key
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">파라미터</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {analysisType !== 'sem' && analysisType !== 'correlation' && (
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">효과크기</span>
                    <select
                      className="rounded-md border bg-background px-3 py-1.5 text-sm"
                      value={effectSize}
                      onChange={(e) => setEffectSize(e.target.value as EffectSize)}
                    >
                      <option value="small">소 (Small)</option>
                      <option value="medium">중 (Medium)</option>
                      <option value="large">대 (Large)</option>
                    </select>
                  </label>
                )}

                {analysisType !== 'sem' && (
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                      검정력 (Power): {power.toFixed(2)}
                    </span>
                    <input
                      type="range"
                      min={0.7}
                      max={0.95}
                      step={0.05}
                      value={power}
                      onChange={(e) => setPower(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>.70</span>
                      <span>.80</span>
                      <span>.90</span>
                      <span>.95</span>
                    </div>
                  </label>
                )}

                {analysisType === 'sem' && (
                  <>
                    <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                      잠재변수: {nLatentVars || '(미설정)'}개 · 문항: {nItems || '(미설정)'}개
                    </div>
                  </>
                )}

                {analysisType === 'regression' && (
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">예측변수 수</span>
                    <input
                      type="number"
                      min={1}
                      className="rounded-md border bg-background px-3 py-1.5 text-sm"
                      value={nPredictors}
                      onChange={(e) => setNPredictors(Number(e.target.value))}
                    />
                  </label>
                )}

                {analysisType === 'anova' && (
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">집단 수</span>
                    <input
                      type="number"
                      min={2}
                      className="rounded-md border bg-background px-3 py-1.5 text-sm"
                      value={nGroups}
                      onChange={(e) => setNGroups(Number(e.target.value))}
                    />
                  </label>
                )}

                {analysisType === 'correlation' && (
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">기대 상관계수 (r)</span>
                    <input
                      type="number"
                      min={0.05}
                      max={0.99}
                      step={0.05}
                      className="rounded-md border bg-background px-3 py-1.5 text-sm"
                      value={expectedR}
                      onChange={(e) => setExpectedR(Number(e.target.value))}
                    />
                  </label>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 우측: 결과 */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center gap-4">
                  <Calculator className="size-10 text-primary" />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">권장 최소 표본</p>
                    <p className="text-4xl font-bold">{result.minimum}명</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">안정적 추정 권장</p>
                    <p className="text-2xl font-semibold text-muted-foreground">
                      {result.recommended}명 이상
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">목표 표본 수 설정</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <input
                  type="number"
                  min={1}
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="목표 표본 수를 입력하세요"
                  value={targetN}
                  onChange={(e) => setTargetN(e.target.value ? Number(e.target.value) : '')}
                />
                {typeof targetN === 'number' && targetN < result.minimum && (
                  <p className="text-xs text-amber-600">
                    ⚠ 목표 표본({targetN}명)이 권장 최소 표본({result.minimum}명)보다 적습니다.
                  </p>
                )}
                <Link href={`/projects/${projectId}/survey/builder`}>
                  <Button className="w-full">
                    설문 빌더로 이동
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
