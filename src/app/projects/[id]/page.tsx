"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  FileText,
  BarChart3,
  ClipboardCheck,
  FileOutput,
  ArrowRight,
  CheckCircle,
  Loader2,
  Circle,
} from "lucide-react"
import { useProjectStore } from "@/lib/store/project-store"

type StepStatus = "completed" | "current" | "waiting"

interface WorkflowStep {
  id: string
  label: string
  icon: React.ElementType
  href: string
  status: StepStatus
  detail?: string
}

export default function ProjectHomePage() {
  const params = useParams()
  const projectId = params.id as string

  const projectName = useProjectStore((s) => s.projectName) || "연구 프로젝트"
  const uploadedData = useProjectStore((s) => s.uploadedData)
  const latentVariables = useProjectStore((s) => s.latentVariables)
  const canvasNodes = useProjectStore((s) => s.canvasNodes)
  const canvasEdges = useProjectStore((s) => s.canvasEdges)
  const versions = useProjectStore((s) => s.versions)

  // 워크플로우 상태 판단
  const hasData = !!uploadedData
  const hasVariables = latentVariables.length > 0
  const hasCanvas = canvasNodes.length > 0
  const hasEdges = canvasEdges.length > 0
  const hasVersions = versions.length > 0

  const totalItems = latentVariables.reduce((sum, v) => sum + v.items.length, 0)

  const steps: WorkflowStep[] = [
    {
      id: "variables",
      label: "변수 설계",
      icon: Settings,
      href: `/projects/${projectId}/variables`,
      status: hasVariables ? "completed" : hasData ? "current" : "waiting",
      detail: hasVariables
        ? `잠재변수 ${latentVariables.length}개 / 관측변수 ${totalItems}개`
        : undefined,
    },
    {
      id: "survey",
      label: "설문 제작",
      icon: FileText,
      href: `/projects/${projectId}/survey/builder`,
      status: hasVariables ? "completed" : "waiting",
      detail: hasVariables ? "설문 구성 완료" : "변수 설계 완료 후 가능",
    },
    {
      id: "data",
      label: "데이터 수집",
      icon: ClipboardCheck,
      href: hasData
        ? `/projects/${projectId}/survey/data`
        : `/projects/${projectId}/upload`,
      status: hasData ? "completed" : hasVariables ? "current" : "waiting",
      detail: hasData
        ? `${uploadedData?.rowCount ?? 0}행 데이터`
        : "설문 응답 수집 또는 파일 업로드",
    },
    {
      id: "analysis",
      label: "분석",
      icon: BarChart3,
      href: `/projects/${projectId}/canvas`,
      status: hasVersions ? "completed" : hasCanvas ? "current" : "waiting",
      detail: hasVersions
        ? `최근 버전: ${versions[versions.length - 1].name}`
        : hasCanvas
          ? `노드 ${canvasNodes.length}개, 경로 ${canvasEdges.length}개`
          : "데이터 수집 완료 후 가능",
    },
    {
      id: "report",
      label: "보고서",
      icon: FileOutput,
      href: `/projects/${projectId}/report`,
      status: hasVersions ? "current" : "waiting",
      detail: hasVersions ? "보고서 생성 가능" : "분석 완료 후 가능",
    },
  ]

  const StatusIcon = ({ status }: { status: StepStatus }) => {
    if (status === "completed") return <CheckCircle className="size-5 text-green-500" />
    if (status === "current") return <Loader2 className="size-5 text-primary" />
    return <Circle className="size-5 text-muted-foreground/30" />
  }

  // 현재 진행 단계
  const currentStep = steps.find((s) => s.status === "current") ?? steps[0]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">
              프로젝트 목록
            </Link>
            <h1 className="text-xl font-bold">{projectName}</h1>
          </div>
          <Link href={currentStep.href}>
            <Button>
              계속하기
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col gap-8">
          {/* 워크플로우 진행 표시 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">연구 워크플로우</CardTitle>
            </CardHeader>
            <CardContent>
              {/* 스텝 진행 바 */}
              <div className="flex items-center justify-between">
                {steps.map((step, i) => (
                  <div key={step.id} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <StatusIcon status={step.status} />
                      <span className={`text-xs font-medium ${
                        step.status === "waiting" ? "text-muted-foreground/50" : "text-foreground"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`mx-2 h-px flex-1 ${
                        step.status === "completed" ? "bg-green-300" : "bg-border"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 단계별 카드 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon
              const isWaiting = step.status === "waiting"
              return (
                <Card
                  key={step.id}
                  className={isWaiting ? "opacity-50" : ""}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-muted-foreground" />
                        <CardTitle className="text-sm">{step.label}</CardTitle>
                      </div>
                      <Badge
                        variant={
                          step.status === "completed"
                            ? "default"
                            : step.status === "current"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {step.status === "completed"
                          ? "완료"
                          : step.status === "current"
                            ? "진행 중"
                            : "대기"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-3 text-xs text-muted-foreground">
                      {step.detail}
                    </p>
                    <Link href={step.href}>
                      <Button
                        variant={step.status === "current" ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        disabled={isWaiting}
                      >
                        {step.status === "completed" ? "다시 보기" : "계속하기"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* 현재 진행 요약 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">프로젝트 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{latentVariables.length}</p>
                  <p className="text-xs text-muted-foreground">잠재변수</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{totalItems}</p>
                  <p className="text-xs text-muted-foreground">관측변수</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{uploadedData?.rowCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">데이터 행</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{versions.length}</p>
                  <p className="text-xs text-muted-foreground">분석 버전</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 빠른 링크 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href={`/projects/${projectId}/hlm-check`}>
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center gap-3 py-4">
                  <BarChart3 className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">다층분석 (HLM)</p>
                    <p className="text-xs text-muted-foreground">ICC·rwg 사전 검증 → HLM</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/projects/${projectId}/basic-analysis`}>
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center gap-3 py-4">
                  <ClipboardCheck className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">기초 분석</p>
                    <p className="text-xs text-muted-foreground">t검정·ANOVA·상관분석·교차분석</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
