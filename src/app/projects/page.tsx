"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Plus, FolderOpen, Clock } from "lucide-react"

export default function ProjectsPage() {
  // TODO: Supabase에서 프로젝트 목록 가져오기 (인증 연동 후)
  const projects: {
    id: string
    title: string
    status: "설계" | "수집" | "분석" | "완료"
    analysisType: string
    updatedAt: string
  }[] = []

  const STATUS_STYLE: Record<string, string> = {
    "설계": "bg-blue-50 text-blue-700",
    "수집": "bg-amber-50 text-amber-700",
    "분석": "bg-violet-50 text-violet-700",
    "완료": "bg-emerald-50 text-emerald-700",
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1E2A3A]">내 프로젝트</h1>
        <Link href="/projects/new">
          <Button size="sm">
            <Plus className="size-4" />
            새 프로젝트
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState
            icon={<FolderOpen className="size-12" />}
            title="첫 번째 프로젝트를 만들어보세요"
            description="데이터 업로드 또는 설문 설계부터 시작할 수 있습니다."
            action={
              <Link href="/projects/new">
                <Button>
                  <Plus className="size-4" />
                  새 프로젝트 만들기
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-semibold text-[#1E2A3A] group-hover:text-[#1E2A3A]/80">
                    {project.title}
                  </h3>
                  <Badge
                    className={`shrink-0 text-[11px] ${STATUS_STYLE[project.status] || ""}`}
                  >
                    {project.status}
                  </Badge>
                </div>
                <p className="mb-3 text-xs text-slate-500">{project.analysisType}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="size-3" />
                  {project.updatedAt}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
