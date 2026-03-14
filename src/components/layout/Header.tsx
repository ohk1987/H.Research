"use client"

import { usePathname, useParams } from "next/navigation"
import { Bell } from "lucide-react"

const PAGE_TITLES: Record<string, string> = {
  "/projects": "프로젝트",
  "/lab": "랩 워크스페이스",
  "/organizations": "조직 관리",
}

const PROJECT_PAGE_TITLES: Record<string, string> = {
  "": "프로젝트 홈",
  "/onboarding": "시작하기",
  "/upload": "데이터 업로드",
  "/variables": "변수 설정",
  "/sample-size": "표본 크기 계산",
  "/canvas": "모델 캔버스",
  "/analysis": "분석 결과",
  "/basic-analysis": "기초 분석",
  "/hlm-check": "다층분석 사전검증",
  "/hlm": "다층분석 (HLM)",
  "/history": "분석 히스토리",
  "/report": "보고서 생성",
  "/results": "분석 결과",
  "/survey/builder": "설문 빌더",
  "/survey/deploy": "설문 배포",
  "/survey/dashboard": "수집 현황",
  "/survey/data": "응답 데이터",
}

export default function Header() {
  const pathname = usePathname()
  const params = useParams()
  const projectId = params.id as string | undefined

  function getPageTitle(): string {
    if (projectId) {
      const subPath = pathname.replace(`/projects/${projectId}`, "")
      return PROJECT_PAGE_TITLES[subPath] || "프로젝트"
    }
    for (const [path, title] of Object.entries(PAGE_TITLES)) {
      if (pathname.startsWith(path)) return title
    }
    return "H.Research"
  }

  function getBreadcrumb(): string[] {
    const crumbs: string[] = []
    if (projectId) {
      crumbs.push("프로젝트")
      const title = getPageTitle()
      if (title !== "프로젝트") crumbs.push(title)
    } else {
      crumbs.push(getPageTitle())
    }
    return crumbs
  }

  const breadcrumb = getBreadcrumb()

  return (
    <header className="flex h-[52px] items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* 좌: 브레드크럼 */}
      <div className="flex items-center gap-1.5 text-sm">
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-slate-300">/</span>}
            <span
              className={
                i === breadcrumb.length - 1
                  ? "font-semibold text-[#1E2A3A]"
                  : "text-slate-400"
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* 우: 알림 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <Bell className="size-4" />
        </button>
        <div className="size-7 rounded-full bg-[#1E2A3A] flex items-center justify-center text-[11px] font-medium text-white">
          U
        </div>
      </div>
    </header>
  )
}
