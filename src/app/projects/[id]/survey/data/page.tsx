"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Download, AlertTriangle } from "lucide-react"
import { useProjectStore } from "@/lib/store/project-store"

// 데모 데이터
const DEMO_VARIABLES = [
  {
    name: '직무만족',
    items: [
      { name: 'q1', mean: 3.42, sd: 0.95, min: 1, max: 5, missing: 2, skewness: -0.12, kurtosis: 0.34 },
      { name: 'q2', mean: 3.65, sd: 0.88, min: 1, max: 5, missing: 0, skewness: -0.23, kurtosis: -0.15 },
      { name: 'q3', mean: 3.18, sd: 1.02, min: 1, max: 5, missing: 1, skewness: 0.08, kurtosis: -0.42, isReversed: true, originalMean: 2.82 },
    ],
    compositeMean: 3.42,
  },
  {
    name: '조직몰입',
    items: [
      { name: 'q4', mean: 3.58, sd: 0.92, min: 1, max: 5, missing: 0, skewness: -0.31, kurtosis: 0.12 },
      { name: 'q5', mean: 3.71, sd: 0.85, min: 1, max: 5, missing: 3, skewness: -0.45, kurtosis: 0.28 },
    ],
    compositeMean: 3.65,
  },
]

const DEMO_GROUP_COMPARISON = [
  { group: '1팀', '직무만족': 3.52, '조직몰입': 3.78 },
  { group: '2팀', '직무만족': 3.31, '조직몰입': 3.45 },
  { group: '3팀', '직무만족': 3.48, '조직몰입': 3.72 },
]

interface QualityWarning {
  variable: string
  item: string
  type: 'missing' | 'skewness' | 'kurtosis' | 'variance'
  message: string
}

export default function SurveyDataPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [activeTab, setActiveTab] = useState(0)
  const [showGroups, setShowGroups] = useState(false)

  // 데이터 품질 경고 계산
  const warnings: QualityWarning[] = []
  const totalN = 128
  DEMO_VARIABLES.forEach((v) => {
    v.items.forEach((item) => {
      if (item.missing / totalN > 0.1) {
        warnings.push({ variable: v.name, item: item.name, type: 'missing', message: `결측치 ${((item.missing / totalN) * 100).toFixed(1)}% (기준: 10%)` })
      }
      if (Math.abs(item.skewness) > 2) {
        warnings.push({ variable: v.name, item: item.name, type: 'skewness', message: `왜도 ${item.skewness.toFixed(2)} (기준: |2|)` })
      }
      if (Math.abs(item.kurtosis) > 7) {
        warnings.push({ variable: v.name, item: item.name, type: 'kurtosis', message: `첨도 ${item.kurtosis.toFixed(2)} (기준: |7|)` })
      }
    })
  })

  // HLM 집단 수 경고
  const groupCount = DEMO_GROUP_COMPARISON.length
  const hlmWarnings: string[] = []
  if (groupCount < 30) {
    hlmWarnings.push(`현재 집단 수: ${groupCount}개. HLM 적용 시 통계적 검정력이 낮을 수 있습니다 (권장: 30개 이상).`)
  }

  // 분석 시작
  const handleStartAnalysis = () => {
    // group_id 컬럼 포함 데이터셋 자동 생성
    router.push(`/projects/${projectId}/canvas`)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${projectId}/survey/dashboard`}>
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">응답 DB 뷰</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="size-4" />
              데이터 다운로드
            </Button>
            <Button onClick={handleStartAnalysis}>
              분석 시작
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-6">
          {/* 데이터 품질 경고 */}
          {(warnings.length > 0 || hlmWarnings.length > 0) && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-amber-700">
                  <AlertTriangle className="size-4" />
                  데이터 품질 경고
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-700">
                    {w.variable} &gt; {w.item}: {w.message}
                  </p>
                ))}
                {hlmWarnings.map((w, i) => (
                  <p key={`hlm-${i}`} className="text-xs font-medium text-amber-700">
                    ⚠ {w}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 잠재변수 탭 */}
          <div className="border-b">
            <div className="flex">
              {DEMO_VARIABLES.map((v, i) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  className={`border-b-2 px-4 py-2 text-sm font-medium ${
                    activeTab === i
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          {/* 문항별 통계 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {DEMO_VARIABLES[activeTab].name} — 문항별 통계
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  합산 평균: {DEMO_VARIABLES[activeTab].compositeMean.toFixed(2)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium">문항</th>
                    <th className="py-2 text-right font-medium">평균</th>
                    <th className="py-2 text-right font-medium">SD</th>
                    <th className="py-2 text-right font-medium">최솟값</th>
                    <th className="py-2 text-right font-medium">최댓값</th>
                    <th className="py-2 text-right font-medium">결측치</th>
                    <th className="py-2 text-right font-medium">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_VARIABLES[activeTab].items.map((item) => (
                    <tr key={item.name} className="border-b last:border-0">
                      <td className="py-2">{item.name}</td>
                      <td className="py-2 text-right">{item.mean.toFixed(2)}</td>
                      <td className="py-2 text-right">{item.sd.toFixed(2)}</td>
                      <td className="py-2 text-right">{item.min}</td>
                      <td className="py-2 text-right">{item.max}</td>
                      <td className="py-2 text-right">{item.missing}</td>
                      <td className="py-2 text-right text-xs">
                        {item.isReversed && (
                          <span className="text-amber-600">
                            역문항 (원: {item.originalMean?.toFixed(2)})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* 그룹별 비교 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">그룹별 비교</CardTitle>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showGroups}
                    onChange={(e) => setShowGroups(e.target.checked)}
                    className="size-4 rounded border"
                  />
                  <span className="text-xs text-muted-foreground">그룹별 표시</span>
                </label>
              </div>
            </CardHeader>
            <CardContent>
              {showGroups ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left font-medium">그룹</th>
                      {DEMO_VARIABLES.map((v) => (
                        <th key={v.name} className="py-2 text-right font-medium">{v.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_GROUP_COMPARISON.map((g) => (
                      <tr key={g.group} className="border-b last:border-0">
                        <td className="py-2 font-medium">{g.group}</td>
                        {DEMO_VARIABLES.map((v) => (
                          <td key={v.name} className="py-2 text-right">
                            {(g[v.name as keyof typeof g] as number)?.toFixed(2) ?? '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-muted-foreground">
                  그룹별 표시를 활성화하면 집단 간 평균 비교를 확인할 수 있습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
