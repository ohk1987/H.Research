"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Users, CheckCircle, Clock, AlertTriangle } from "lucide-react"

// 데모 데이터
const DEMO_STATS = {
  total: 156,
  completed: 128,
  inProgress: 15,
  abandoned: 13,
  targetResponses: 200,
}

const DEMO_GROUP_STATS = [
  { groupName: '1팀', completed: 23, inProgress: 3, total: 30, completionRate: 77 },
  { groupName: '2팀', completed: 18, inProgress: 5, total: 30, completionRate: 60 },
  { groupName: '3팀', completed: 28, inProgress: 2, total: 30, completionRate: 93 },
  { groupName: '4팀', completed: 15, inProgress: 5, total: 30, completionRate: 50 },
]

const DEMO_DAILY = [
  { date: '03-07', count: 12 },
  { date: '03-08', count: 25 },
  { date: '03-09', count: 31 },
  { date: '03-10', count: 18 },
  { date: '03-11', count: 22 },
  { date: '03-12', count: 14 },
  { date: '03-13', count: 6 },
]

const DEMO_PAGE_DROPOUT = [
  { page: 1, dropoutRate: 3 },
  { page: 2, dropoutRate: 5 },
  { page: 3, dropoutRate: 12 },
]

export default function SurveyDashboardPage() {
  const params = useParams()
  const projectId = params.id as string

  const completionRate = Math.round((DEMO_STATS.completed / DEMO_STATS.targetResponses) * 100)
  const abandonRate = Math.round((DEMO_STATS.abandoned / DEMO_STATS.total) * 100)

  // 일별 추이 최대값 (차트 높이 계산용)
  const maxDaily = Math.max(...DEMO_DAILY.map((d) => d.count))

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${projectId}/survey/deploy`}>
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">응답 현황</h1>
          </div>
          <Link href={`/projects/${projectId}/survey/data`}>
            <Button variant="outline">응답 DB 뷰</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-6">
          {/* 상단 카드 */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <Users className="size-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{DEMO_STATS.total}</p>
                  <p className="text-xs text-muted-foreground">전체 접속</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <CheckCircle className="size-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{DEMO_STATS.completed}</p>
                  <p className="text-xs text-muted-foreground">완료</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <Clock className="size-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{DEMO_STATS.inProgress}</p>
                  <p className="text-xs text-muted-foreground">진행 중</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <AlertTriangle className="size-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{abandonRate}%</p>
                  <p className="text-xs text-muted-foreground">이탈률</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 목표 대비 진행률 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">목표 대비 진행률</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-4 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(completionRate, 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {DEMO_STATS.completed}/{DEMO_STATS.targetResponses} ({completionRate}%)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 그룹별 현황 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">그룹별 응답 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium">그룹명</th>
                    <th className="py-2 text-right font-medium">완료</th>
                    <th className="py-2 text-right font-medium">진행 중</th>
                    <th className="py-2 text-right font-medium">목표</th>
                    <th className="py-2 text-right font-medium">완료율</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_GROUP_STATS.map((g) => (
                    <tr key={g.groupName} className="border-b last:border-0">
                      <td className="py-2 font-medium">{g.groupName}</td>
                      <td className="py-2 text-right">{g.completed}</td>
                      <td className="py-2 text-right">{g.inProgress}</td>
                      <td className="py-2 text-right">{g.total}</td>
                      <td className="py-2 text-right">
                        <span className={g.completionRate >= 70 ? 'text-green-600' : g.completionRate >= 50 ? 'text-amber-600' : 'text-red-600'}>
                          {g.completionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* 일별 응답 추이 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">일별 응답 추이</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2" style={{ height: 120 }}>
                {DEMO_DAILY.map((d) => (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">{d.count}</span>
                    <div
                      className="w-full rounded-t bg-primary/70"
                      style={{ height: `${(d.count / maxDaily) * 100}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{d.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 페이지별 이탈 분석 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">페이지별 이탈 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {DEMO_PAGE_DROPOUT.map((p) => (
                  <div key={p.page} className="flex items-center gap-3">
                    <span className="w-20 text-sm">페이지 {p.page}</span>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${p.dropoutRate > 10 ? 'bg-red-500' : 'bg-amber-400'}`}
                          style={{ width: `${p.dropoutRate}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-12 text-right text-sm">
                      {p.dropoutRate > 10 && <AlertTriangle className="mr-1 inline size-3 text-red-500" />}
                      {p.dropoutRate}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
