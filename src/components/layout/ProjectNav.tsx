"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Upload,
  Settings,
  LayoutGrid,
  BarChart3,
  FileText,
  Layers,
  ClipboardCheck,
  FileOutput,
  History,
  Home,
} from "lucide-react"

interface ProjectNavProps {
  projectId: string
}

const NAV_ITEMS = [
  { href: "", label: "홈", icon: Home },
  { href: "upload", label: "데이터 업로드", icon: Upload },
  { href: "variables", label: "변수 설정", icon: Settings },
  { href: "canvas", label: "모델 캔버스", icon: LayoutGrid },
  { href: "analysis", label: "분석 결과", icon: BarChart3 },
  { href: "basic-analysis", label: "기초 분석", icon: FileText },
  { href: "hlm-check", label: "다층분석 사전검증", icon: ClipboardCheck },
  { href: "hlm", label: "다층분석(HLM)", icon: Layers },
  { href: "report", label: "보고서", icon: FileOutput },
  { href: "history", label: "히스토리", icon: History },
]

export default function ProjectNav({ projectId }: ProjectNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto border-b px-4 py-1">
      {NAV_ITEMS.map((item) => {
        const href = item.href
          ? `/projects/${projectId}/${item.href}`
          : `/projects/${projectId}`
        const isActive = pathname === href

        return (
          <Link
            key={item.href || "home"}
            href={href}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
