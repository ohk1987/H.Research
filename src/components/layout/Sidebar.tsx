"use client"

import { usePathname, useParams } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  Calculator,
  FileText,
  ClipboardList,
  BarChart3,
  Activity,
  Layers,
  History,
  FileOutput,
  Users,
  Building2,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

interface NavGroup {
  title: string
  items: NavItem[]
  collapsible?: boolean
}

export default function Sidebar() {
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string | undefined

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    project: true,
    research: true,
    data: true,
    analysis: true,
    results: true,
    collab: true,
  })

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const mainNav: NavItem[] = [
    { label: "대시보드", href: "/projects", icon: LayoutDashboard },
  ]

  const projectNav: NavGroup[] = projectId
    ? [
        {
          title: "연구 설계",
          items: [
            { label: "변수 설정", href: `/projects/${projectId}/variables`, icon: Settings },
            { label: "표본 크기", href: `/projects/${projectId}/sample-size`, icon: Calculator },
          ],
        },
        {
          title: "데이터 수집",
          items: [
            { label: "설문 빌더", href: `/projects/${projectId}/survey/builder`, icon: FileText },
            { label: "설문 배포", href: `/projects/${projectId}/survey/deploy`, icon: ClipboardList },
            { label: "수집 현황", href: `/projects/${projectId}/survey/dashboard`, icon: Activity },
            { label: "응답 데이터", href: `/projects/${projectId}/survey/data`, icon: BarChart3 },
          ],
        },
        {
          title: "분석",
          items: [
            { label: "모델 캔버스", href: `/projects/${projectId}/canvas`, icon: Layers },
            { label: "기초 분석", href: `/projects/${projectId}/basic-analysis`, icon: BarChart3 },
            { label: "다층분석", href: `/projects/${projectId}/hlm-check`, icon: Activity },
          ],
        },
        {
          title: "결과",
          items: [
            { label: "분석 히스토리", href: `/projects/${projectId}/history`, icon: History },
            { label: "보고서 생성", href: `/projects/${projectId}/report`, icon: FileOutput },
          ],
        },
      ]
    : []

  const collabNav: NavItem[] = [
    { label: "랩 워크스페이스", href: "/lab", icon: Users },
    { label: "조직 관리", href: "/organizations", icon: Building2 },
  ]

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[220px] flex-col bg-[#1E2A3A] text-slate-300">
      {/* 로고 */}
      <div className="flex h-[52px] items-center px-5">
        <Link href="/projects" className="text-lg font-bold text-white tracking-tight">
          H.Research
        </Link>
      </div>

      {/* 현재 프로젝트 표시 */}
      {projectId && (
        <div className="mx-3 mb-2 rounded-md bg-white/5 px-3 py-2">
          <Link
            href={`/projects/${projectId}`}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <FolderKanban className="size-3.5" />
            <span className="truncate font-medium text-slate-200">현재 프로젝트</span>
          </Link>
        </div>
      )}

      {/* 스크롤 가능 메뉴 영역 */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {/* 메인 메뉴 */}
        <div className="mb-1">
          {mainNav.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* 프로젝트 네비게이션 */}
        {projectNav.length > 0 && (
          <>
            <div className="my-3 h-px bg-white/10" />
            {projectNav.map((group) => {
              const groupKey = group.title
              const expanded = expandedGroups[groupKey] !== false
              return (
                <div key={groupKey} className="mb-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(groupKey)}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
                  >
                    {group.title}
                    {expanded ? (
                      <ChevronDown className="size-3" />
                    ) : (
                      <ChevronRight className="size-3" />
                    )}
                  </button>
                  {expanded &&
                    group.items.map((item) => {
                      const Icon = item.icon
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                            active
                              ? "bg-white/10 font-medium text-white"
                              : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                          }`}
                        >
                          <Icon className="size-3.5" />
                          {item.label}
                        </Link>
                      )
                    })}
                </div>
              )
            })}
          </>
        )}

        {/* 협업 */}
        <div className="my-3 h-px bg-white/10" />
        <div className="mb-1">
          <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            협업
          </p>
          {collabNav.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                  active
                    ? "bg-white/10 font-medium text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* 하단: 로그아웃 */}
      <div className="border-t border-white/10 px-3 py-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
        >
          <LogOut className="size-4" />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
