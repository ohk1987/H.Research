"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Users, BarChart3, FileText, ClipboardList } from "lucide-react"

// 데모 데이터 (진행 상황만, 내용 불가)
const DEMO_SUMMARY = {
  totalMembers: 24,
  activeThisMonth: 18,
  completedAnalyses: 47,
  licenseSeatUsed: 24,
  licenseSeatTotal: 30,
}

const DEMO_MEMBER_ACTIVITY = [
  { name: '이연구원', lastAccess: '2026-03-13', projects: 3, analysesCompleted: 12, surveysDeployed: 1 },
  { name: '박학생', lastAccess: '2026-03-10', projects: 2, analysesCompleted: 5, surveysDeployed: 0 },
  { name: '최학생', lastAccess: '2026-02-15', projects: 1, analysesCompleted: 0, surveysDeployed: 0 },
  { name: '정학생', lastAccess: '2026-03-12', projects: 4, analysesCompleted: 8, surveysDeployed: 2 },
]

const DEMO_PROJECTS = [
  { title: '직무만족 연구', status: 'active', lastModified: '2026-03-13' },
  { title: '리더십 효과 분석', status: 'completed', lastModified: '2026-03-08' },
  { title: '조직문화 연구', status: 'active', lastModified: '2026-03-11' },
  { title: '소비자 행동 조사', status: 'draft', lastModified: '2026-02-20' },
]

const statusLabels: Record<string, string> = {
  active: '진행 중',
  completed: '완료',
  draft: '미시작',
}

const statusColors: Record<string, string> = {
  active: 'text-blue-600',
  completed: 'text-green-600',
  draft: 'text-muted-foreground',
}

export default function OrgAdminPage() {
  const params = useParams()
  const orgId = params.orgId as string

  const projectStatusCounts = {
    active: DEMO_PROJECTS.filter((p) => p.status === 'active').length,
    completed: DEMO_PROJECTS.filter((p) => p.status === 'completed').length,
    draft: DEMO_PROJECTS.filter((p) => p.status === 'draft').length,
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
          <Link href={`/organizations/${orgId}`}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="ml-3 text-xl font-bold">관리자 대시보드</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-6">
          {/* 상단 요약 카드 */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <Users className="size-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{DEMO_SUMMARY.totalMembers}</p>
                  <p className="text-xs text-muted-foreground">전체 멤버</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <Users className="size-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{DEMO_SUMMARY.activeThisMonth}</p>
                  <p className="text-xs text-muted-foreground">이번 달 활성</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <BarChart3 className="size-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{DEMO_SUMMARY.completedAnalyses}</p>
                  <p className="text-xs text-muted-foreground">완료된 분석</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <FileText className="size-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {DEMO_SUMMARY.licenseSeatUsed}/{DEMO_SUMMARY.licenseSeatTotal}
                  </p>
                  <p className="text-xs text-muted-foreground">라이선스</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 멤버별 활동 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">멤버별 활동 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium">이름</th>
                    <th className="py-2 text-right font-medium">마지막 접속</th>
                    <th className="py-2 text-right font-medium">프로젝트 수</th>
                    <th className="py-2 text-right font-medium">분석 완료</th>
                    <th className="py-2 text-right font-medium">설문 배포</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_MEMBER_ACTIVITY
                    .sort((a, b) => new Date(b.lastAccess).getTime() - new Date(a.lastAccess).getTime())
                    .map((m) => {
                      const daysSince = Math.floor(
                        (Date.now() - new Date(m.lastAccess).getTime()) / 86400000
                      )
                      return (
                        <tr key={m.name} className={`border-b last:border-0 ${daysSince > 30 ? 'text-muted-foreground/50' : ''}`}>
                          <td className="py-2">{m.name}</td>
                          <td className="py-2 text-right text-xs">
                            {m.lastAccess}
                            {daysSince > 30 && <span className="ml-1 text-amber-500">(미사용)</span>}
                          </td>
                          <td className="py-2 text-right">{m.projects}</td>
                          <td className="py-2 text-right">{m.analysesCompleted}</td>
                          <td className="py-2 text-right">{m.surveysDeployed}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* 프로젝트 현황 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">프로젝트 현황</CardTitle>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>진행 중: {projectStatusCounts.active}</span>
                  <span>완료: {projectStatusCounts.completed}</span>
                  <span>미시작: {projectStatusCounts.draft}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium">제목</th>
                    <th className="py-2 text-center font-medium">상태</th>
                    <th className="py-2 text-right font-medium">마지막 수정</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_PROJECTS.map((p) => (
                    <tr key={p.title} className="border-b last:border-0">
                      <td className="py-2">{p.title}</td>
                      <td className={`py-2 text-center text-xs font-medium ${statusColors[p.status]}`}>
                        {statusLabels[p.status]}
                      </td>
                      <td className="py-2 text-right text-xs">{p.lastModified}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-[10px] text-muted-foreground">
                * 프로젝트 내용(데이터·모델·결과)은 표시되지 않습니다.
              </p>
            </CardContent>
          </Card>

          {/* 설문 현황 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ClipboardList className="size-4" />
                설문 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-8">
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-xs text-muted-foreground">배포 중인 설문</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">486</p>
                  <p className="text-xs text-muted-foreground">총 응답 수</p>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground">
                * 설문 문항·응답 내용은 표시되지 않습니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
