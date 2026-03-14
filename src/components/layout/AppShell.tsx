"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Sidebar from "./Sidebar"
import Header from "./Header"

// 사이드바 없이 렌더링하는 경로
const PUBLIC_PATHS = ["/", "/auth/login", "/auth/signup"]
const SURVEY_RESPONSE_PREFIX = "/survey/"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const isPublicPath =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith(SURVEY_RESPONSE_PREFIX)

  // 로딩 중이거나 퍼블릭 경로는 사이드바 없이 렌더링
  if (isLoggedIn === null || isPublicPath || !isLoggedIn) {
    return <>{children}</>
  }

  // 로그인 상태: 사이드바 + 헤더 레이아웃
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-[220px] flex flex-1 flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
