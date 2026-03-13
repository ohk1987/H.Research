"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RotateCcw, CheckCircle, Clock } from "lucide-react"
import { useProjectStore } from "@/lib/store/project-store"

// 데모 분석 이력
const DEMO_HISTORY = [
  {
    id: "run_1",
    version: "초기 모델 v1",
    type: "CFA + SEM",
    date: "2026-03-10 14:23",
    cfi: 0.961,
    rmsea: 0.048,
    srmr: 0.042,
    approved: true,
  },
  {
    id: "run_2",
    version: "초기 모델 v1 (WLSMV)",
    type: "CFA + SEM",
    date: "2026-03-10 15:01",
    cfi: 0.955,
    rmsea: 0.052,
    srmr: 0.045,
    approved: false,
  },
  {
    id: "run_3",
    version: "매개변수 추가 v2",
    type: "CFA + SEM + 매개분석",
    date: "2026-03-11 10:15",
    cfi: 0.948,
    rmsea: 0.055,
    srmr: 0.051,
    approved: false,
  },
]

export default function HistoryPage() {
  const params = useParams()
  const projectId = params.id as string
  const loadVersion = useProjectStore((s) => s.loadVersion)
  const versions = useProjectStore((s) => s.versions)

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev
    )
  }

  const selectedRuns = DEMO_HISTORY.filter((r) => selectedIds.includes(r.id))

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${projectId}`}>
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">분석 히스토리</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col gap-6">
          {/* 타임라인 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">분석 실행 기록</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-0">
                {DEMO_HISTORY.map((run, i) => (
                  <div key={run.id} className="flex gap-4">
                    {/* 타임라인 축 */}
                    <div className="flex flex-col items-center">
                      <div className={`size-3 rounded-full ${
                        run.approved ? "bg-green-500" : "bg-primary"
                      }`} />
                      {i < DEMO_HISTORY.length - 1 && (
                        <div className="w-px flex-1 bg-border" />
                      )}
                    </div>

                    {/* 카드 */}
                    <div className="mb-4 flex-1 rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{run.version}</p>
                            {run.approved && (
                              <Badge variant="default" className="flex items-center gap-1">
                                <CheckCircle className="size-3" />
                                승인됨
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {run.date}
                            <span>|</span>
                            <span>{run.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(run.id)}
                              onChange={() => toggleSelect(run.id)}
                              className="size-3.5 rounded"
                            />
                            비교
                          </label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // 실제로는 해당 분석 결과 버전을 복원
                              if (versions.length > 0) {
                                loadVersion(versions[0].id)
                              }
                            }}
                          >
                            <RotateCcw className="size-3" />
                            복원
                          </Button>
                        </div>
                      </div>

                      {/* 주요 지표 */}
                      <div className="mt-3 flex gap-4">
                        <div className="text-center">
                          <p className="font-mono text-sm font-semibold">{run.cfi.toFixed(3)}</p>
                          <p className="text-xs text-muted-foreground">CFI</p>
                        </div>
                        <div className="text-center">
                          <p className="font-mono text-sm font-semibold">{run.rmsea.toFixed(3)}</p>
                          <p className="text-xs text-muted-foreground">RMSEA</p>
                        </div>
                        <div className="text-center">
                          <p className="font-mono text-sm font-semibold">{run.srmr.toFixed(3)}</p>
                          <p className="text-xs text-muted-foreground">SRMR</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 버전 비교 테이블 */}
          {selectedRuns.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">버전 간 지표 비교</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-4">버전</th>
                        <th className="pb-2 pr-4">CFI</th>
                        <th className="pb-2 pr-4">RMSEA</th>
                        <th className="pb-2 pr-4">SRMR</th>
                        <th className="pb-2 pr-4">날짜</th>
                        <th className="pb-2 pr-4">승인</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRuns.map((run) => (
                        <tr key={run.id} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium">{run.version}</td>
                          <td className={`py-2 pr-4 font-mono ${
                            run.cfi >= 0.95 ? "text-green-600" : run.cfi >= 0.90 ? "text-yellow-600" : "text-red-500"
                          }`}>
                            {run.cfi.toFixed(3)}
                          </td>
                          <td className={`py-2 pr-4 font-mono ${
                            run.rmsea <= 0.05 ? "text-green-600" : run.rmsea <= 0.08 ? "text-yellow-600" : "text-red-500"
                          }`}>
                            {run.rmsea.toFixed(3)}
                          </td>
                          <td className={`py-2 pr-4 font-mono ${
                            run.srmr <= 0.05 ? "text-green-600" : run.srmr <= 0.08 ? "text-yellow-600" : "text-red-500"
                          }`}>
                            {run.srmr.toFixed(3)}
                          </td>
                          <td className="py-2 pr-4 text-muted-foreground">{run.date}</td>
                          <td className="py-2 pr-4">
                            {run.approved && (
                              <Badge variant="default" className="flex w-fit items-center gap-1">
                                <CheckCircle className="size-3" />
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedIds.length > 0 && selectedIds.length < 2 && (
            <p className="text-center text-xs text-muted-foreground">
              비교하려면 2개 이상의 버전을 선택하세요 (최대 3개)
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
