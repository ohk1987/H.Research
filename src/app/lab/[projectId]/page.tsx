"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, MessageSquare, CheckCircle, Send } from "lucide-react"
import CommentPanel from "@/components/lab/CommentPanel"
import ApprovalButton from "@/components/lab/ApprovalButton"

// 데모 분석 결과 (읽기 전용)
const DEMO_FIT = { cfi: 0.961, tli: 0.953, rmsea: 0.048, srmr: 0.042 }
const DEMO_PATHS = [
  { from: '직무만족', to: '조직몰입', beta: 0.523, p: 0.001 },
  { from: '조직몰입', to: '이직의도', beta: -0.412, p: 0.001 },
]

export default function LabProjectPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [showComments, setShowComments] = useState(false)

  const isSupervisor = true // 데모

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/lab">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold">직무만족과 조직몰입 연구</h1>
              <p className="text-xs text-muted-foreground">이학생 · 검토 요청</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageSquare className="size-4" />
              코멘트
            </Button>
            {isSupervisor && <ApprovalButton projectId={projectId} />}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className={`grid gap-6 ${showComments ? 'grid-cols-[1fr_320px]' : ''}`}>
          <div className="flex flex-col gap-6">
            {/* 모형적합도 (읽기 전용) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">모형적합도</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(DEMO_FIT).map(([key, val]) => (
                    <div key={key} className="rounded-md bg-muted/50 p-3 text-center">
                      <p className="text-xs text-muted-foreground">{key.toUpperCase()}</p>
                      <p className="text-lg font-bold">{val.toFixed(3)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 경로계수 (읽기 전용) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">경로계수</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left font-medium">경로</th>
                      <th className="py-2 text-right font-medium">β</th>
                      <th className="py-2 text-right font-medium">p</th>
                      <th className="py-2 text-center font-medium">유의성</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_PATHS.map((p) => (
                      <tr key={`${p.from}-${p.to}`} className="border-b last:border-0">
                        <td className="py-2">{p.from} → {p.to}</td>
                        <td className="py-2 text-right">{p.beta.toFixed(3)}</td>
                        <td className="py-2 text-right">{p.p < 0.001 ? '<.001' : p.p.toFixed(3)}</td>
                        <td className="py-2 text-center">
                          {p.p < 0.001 ? '🟢' : p.p < 0.05 ? '🟡' : '🔴'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* 해석 (읽기 전용) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">한국어 해석</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {`측정모형의 적합도는 CFI=.961, TLI=.953, RMSEA=.048, SRMR=.042로 양호한 수준이었다.\n\n직무만족이 조직몰입에 미치는 영향은 β=.523(p<.001)로 통계적으로 유의한 정(+)적 영향을 미치는 것으로 나타났다.\n\n조직몰입이 이직의도에 미치는 영향은 β=-.412(p<.001)로 통계적으로 유의한 부(-)적 영향을 미치는 것으로 나타났다.`}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 코멘트 패널 */}
          {showComments && (
            <CommentPanel
              reviewRequestId="rr1"
              onClose={() => setShowComments(false)}
            />
          )}
        </div>
      </main>
    </div>
  )
}
