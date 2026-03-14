"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle, CalendarDays, Target, Inbox } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { createClient } from "@/lib/supabase/client"
import SurveySteps from "@/components/survey/SurveySteps"

interface DailyCount {
  date: string
  count: number
}

interface GroupStat {
  groupId: string
  groupName: string
  completed: number
  completionRate: number
}

export default function SurveyDashboardPage() {
  const params = useParams()
  const projectId = params.id as string
  const formId = projectId // 임시: formId = projectId

  const [completedCount, setCompletedCount] = useState(0)
  const [todayCount, setTodayCount] = useState(0)
  const [targetResponses, setTargetResponses] = useState<number | null>(null)
  const [groupStats, setGroupStats] = useState<GroupStat[]>([])
  const [dailyData, setDailyData] = useState<DailyCount[]>([])
  const [loading, setLoading] = useState(true)

  // 데이터 로드
  const loadStats = useCallback(async () => {
    const supabase = createClient()

    try {
      // 설문 폼 정보 (목표 응답 수)
      const { data: form } = await supabase
        .from("survey_forms")
        .select("target_responses")
        .eq("id", formId)
        .single()

      if (form?.target_responses) {
        setTargetResponses(form.target_responses)
      }

      // 완료된 응답 조회
      const { data: responses } = await supabase
        .from("survey_responses")
        .select("id, group_id, completed_at, is_complete")
        .eq("form_id", formId)
        .eq("is_complete", true)

      const completed = responses ?? []
      setCompletedCount(completed.length)

      // 오늘 응답 수
      const today = new Date().toISOString().split("T")[0]
      const todayResponses = completed.filter(
        (r) => r.completed_at && r.completed_at.startsWith(today)
      )
      setTodayCount(todayResponses.length)

      // 일별 응답 추이 (최근 14일)
      const dailyMap = new Map<string, number>()
      for (let i = 13; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        dailyMap.set(d.toISOString().split("T")[0], 0)
      }
      completed.forEach((r) => {
        if (r.completed_at) {
          const date = r.completed_at.split("T")[0]
          if (dailyMap.has(date)) {
            dailyMap.set(date, (dailyMap.get(date) ?? 0) + 1)
          }
        }
      })
      setDailyData(
        Array.from(dailyMap.entries()).map(([date, count]) => ({
          date: date.slice(5), // MM-DD
          count,
        }))
      )

      // 그룹별 통계
      const { data: groups } = await supabase
        .from("survey_groups")
        .select("id, name")
        .eq("form_id", formId)

      if (groups && groups.length > 0) {
        const stats: GroupStat[] = groups.map((g) => {
          const groupCompleted = completed.filter((r) => r.group_id === g.id)
          return {
            groupId: g.id,
            groupName: g.name,
            completed: groupCompleted.length,
            completionRate: 0, // 그룹별 목표가 없으므로 전체 대비 비율만 표시
          }
        })
        setGroupStats(stats)
      } else {
        setGroupStats([])
      }
    } catch {
      // DB 연결 실패 시 빈 상태 유지
    } finally {
      setLoading(false)
    }
  }, [formId])

  // 초기 로드 + Realtime 구독
  useEffect(() => {
    loadStats()

    const supabase = createClient()
    const channel = supabase
      .channel(`survey_responses_${formId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "survey_responses",
          filter: `form_id=eq.${formId}`,
        },
        () => {
          // 새 응답이 들어오면 통계 갱신
          loadStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [formId, loadStats])

  const completionRate = targetResponses
    ? Math.round((completedCount / targetResponses) * 100)
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Link href={`/projects/${projectId}/survey/deploy`}>
                <Button variant="ghost" size="icon-sm">
                  <ArrowLeft className="size-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold">수집 현황</h1>
            </div>
            <SurveySteps current={3} />
            <Link href={`/projects/${projectId}/survey/data`}>
              <Button variant="outline">응답 데이터</Button>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        </main>
      </div>
    )
  }

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
            <h1 className="text-xl font-bold">수집 현황</h1>
          </div>
          <SurveySteps current={3} />
          <Link href={`/projects/${projectId}/survey/data`}>
            <Button variant="outline">응답 데이터</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-6">
          {/* 상단 카드 */}
          <div className={`grid gap-4 ${targetResponses ? "grid-cols-3" : "grid-cols-2"}`}>
            <Card>
              <CardContent className="flex items-center gap-3 py-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50">
                  <CheckCircle className="size-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1E2A3A]">{completedCount}</p>
                  <p className="text-xs text-muted-foreground">전체 완료 응답</p>
                </div>
              </CardContent>
            </Card>

            {targetResponses && (
              <Card>
                <CardContent className="flex items-center gap-3 py-5">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50">
                    <Target className="size-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1E2A3A]">
                      {completionRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      목표 달성률 ({completedCount}/{targetResponses})
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="flex items-center gap-3 py-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50">
                  <CalendarDays className="size-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1E2A3A]">{todayCount}</p>
                  <p className="text-xs text-muted-foreground">오늘 응답</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 목표 대비 진행률 바 */}
          {targetResponses && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-3 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#1E2A3A] transition-all"
                        style={{ width: `${Math.min(completionRate ?? 0, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[#1E2A3A]">
                    {completedCount}/{targetResponses}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 그룹별 현황 (그룹이 있을 때만) */}
          {groupStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">그룹별 응답 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left font-medium text-slate-500">그룹명</th>
                      <th className="py-2 text-right font-medium text-slate-500">완료</th>
                      <th className="py-2 text-right font-medium text-slate-500">완료율</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupStats.map((g) => {
                      const rate = completedCount > 0
                        ? Math.round((g.completed / completedCount) * 100)
                        : 0
                      return (
                        <tr key={g.groupId} className="border-b last:border-0">
                          <td className="py-2 font-medium text-[#1E2A3A]">{g.groupName}</td>
                          <td className="py-2 text-right text-[#1E2A3A]">{g.completed}</td>
                          <td className="py-2 text-right">
                            <span className={
                              rate >= 30 ? "text-emerald-600" :
                              rate >= 15 ? "text-amber-600" :
                              "text-slate-400"
                            }>
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* 일별 응답 추이 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">일별 응답 추이</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyData.every((d) => d.count === 0) ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Inbox className="mb-2 size-8 text-slate-200" />
                  <p className="text-sm text-muted-foreground">아직 응답이 없습니다</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                      }}
                      formatter={(value) => [`${value}건`, "완료 응답"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#1E2A3A"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#1E2A3A" }}
                      activeDot={{ r: 5, fill: "#1E2A3A" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
