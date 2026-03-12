"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Clock, CheckCircle, MessageSquare } from "lucide-react"

// 데모: 교수 뷰
const DEMO_STUDENTS = [
  { id: 's1', name: '이학생', email: 'lee@snu.ac.kr', sharedProjects: 2 },
  { id: 's2', name: '박학생', email: 'park@snu.ac.kr', sharedProjects: 1 },
]

const DEMO_REVIEW_REQUESTS = [
  {
    id: 'rr1',
    projectTitle: '직무만족과 조직몰입 연구',
    studentName: '이학생',
    status: 'pending' as const,
    message: 'CFA 결과 검토 부탁드립니다.',
    createdAt: '2026-03-12T14:30:00Z',
    projectId: 'p1',
  },
  {
    id: 'rr2',
    projectTitle: '리더십 유형 분석',
    studentName: '박학생',
    status: 'commented' as const,
    message: 'SEM 구조모형 결과 확인 요청',
    createdAt: '2026-03-10T09:15:00Z',
    projectId: 'p2',
  },
]

const statusLabels: Record<string, string> = {
  pending: '검토 대기',
  reviewing: '검토 중',
  commented: '코멘트 완료',
  approved: '승인 완료',
}

const statusColors: Record<string, string> = {
  pending: 'text-amber-600 bg-amber-50',
  reviewing: 'text-blue-600 bg-blue-50',
  commented: 'text-purple-600 bg-purple-50',
  approved: 'text-green-600 bg-green-50',
}

export default function LabPage() {
  const isSupervisor = true // 데모: 교수 뷰

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
          <h1 className="text-xl font-bold">랩 워크스페이스</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col gap-6">
          {/* 지도 학생 / 지도교수 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4" />
                {isSupervisor ? '지도 학생' : '지도교수'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isSupervisor ? (
                <div className="flex flex-col gap-2">
                  {DEMO_STUDENTS.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FileText className="size-3" />
                        공유 프로젝트 {s.sharedProjects}개
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border p-3">
                  <p className="font-medium">김교수</p>
                  <p className="text-xs text-muted-foreground">kim@snu.ac.kr</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 검토 요청 목록 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="size-4" />
                검토 요청
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {DEMO_REVIEW_REQUESTS.map((rr) => (
                  <Link key={rr.id} href={`/lab/${rr.projectId}`}>
                    <div className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{rr.projectTitle}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {rr.studentName} · {new Date(rr.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[rr.status]}`}>
                          {statusLabels[rr.status]}
                        </span>
                      </div>
                      {rr.message && (
                        <p className="mt-2 text-sm text-muted-foreground">{rr.message}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
