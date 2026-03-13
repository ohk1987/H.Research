"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session)
    })
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">H.Research</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          한국 사회과학 연구자를 위한 통계 분석 플랫폼
        </p>
      </div>

      {/* 로딩 중에는 버튼 숨김 */}
      {isLoggedIn === null ? (
        <div className="h-10" />
      ) : isLoggedIn ? (
        <Link href="/projects">
          <Button size="lg">대시보드로 이동</Button>
        </Link>
      ) : (
        <div className="flex gap-3">
          <Link href="/auth/login">
            <Button variant="outline" size="lg">로그인</Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="lg">회원가입</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
