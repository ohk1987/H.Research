"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  FileText,
  BarChart3,
  Languages,
  ArrowRight,
  CheckCircle,
} from "lucide-react"

const FEATURES = [
  {
    icon: FileText,
    title: "설문 설계 & 배포",
    description: "잠재변수 정의부터 설문 배포, 실시간 응답 모니터링까지 단일 플랫폼에서 처리합니다.",
  },
  {
    icon: BarChart3,
    title: "SEM·HLM 통계 분석",
    description: "CFA, SEM, PROCESS, PLS-SEM, 다층분석까지. R 기반 엔진으로 논문 수준 정확도를 제공합니다.",
  },
  {
    icon: Languages,
    title: "한국어 자동 해석",
    description: "APA 7판 학술 문체의 한국어 결과 해석을 자동 생성합니다. 보고서까지 원클릭 출력.",
  },
]

const COMPARISONS = [
  { feature: "연간 비용", legacy: "SPSS+AMOS 200~400만 원", ours: "1/10 가격" },
  { feature: "워크플로우", legacy: "5개+ 도구 전환", ours: "단일 플랫폼" },
  { feature: "결과 해석", legacy: "직접 작성", ours: "한국어 자동 생성" },
  { feature: "설문→분석 연결", legacy: "파일 변환 필요", ours: "자동 연결" },
]

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session)
    })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* 네비게이션 */}
      <nav className="border-b border-slate-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-[#1E2A3A] tracking-tight">H.Research</span>
          <div className="flex items-center gap-3">
            {isLoggedIn === null ? null : isLoggedIn ? (
              <Link href="/projects">
                <Button>대시보드로 이동</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">로그인</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">무료로 시작하기</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 히어로 */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h1 className="text-4xl font-bold leading-tight text-[#1E2A3A] sm:text-5xl">
          사회과학 연구자를 위한
          <br />
          <span className="text-slate-500">통합 분석 플랫폼</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-500 leading-relaxed">
          연구 설계부터 설문 배포, SEM 분석, 한국어 자동 해석, APA 보고서까지
          <br className="hidden sm:block" />
          하나의 워크플로우로 완성하세요.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          {isLoggedIn ? (
            <Link href="/projects">
              <Button size="lg" className="h-11 px-6 text-[15px]">
                대시보드로 이동
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/signup">
                <Button size="lg" className="h-11 px-6 text-[15px]">
                  무료로 시작하기
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg" className="h-11 px-6 text-[15px]">
                  로그인
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* 기능 카드 */}
      <section className="border-t border-slate-100 bg-slate-50/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-2xl font-bold text-[#1E2A3A]">
            핵심 기능
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-[#1E2A3A]/5">
                    <Icon className="size-5 text-[#1E2A3A]" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-[#1E2A3A]">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 비교 표 */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-8 text-center text-2xl font-bold text-[#1E2A3A]">
            기존 도구와 비교
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-3 text-left font-medium text-slate-500">항목</th>
                  <th className="px-5 py-3 text-left font-medium text-slate-500">SPSS + AMOS</th>
                  <th className="px-5 py-3 text-left font-medium text-[#1E2A3A]">H.Research</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISONS.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={i < COMPARISONS.length - 1 ? "border-b border-slate-100" : ""}
                  >
                    <td className="px-5 py-3 font-medium text-[#1E2A3A]">{row.feature}</td>
                    <td className="px-5 py-3 text-slate-500">{row.legacy}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5 font-medium text-[#1E2A3A]">
                        <CheckCircle className="size-3.5 text-emerald-500" />
                        {row.ours}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 하단 CTA */}
      <section className="border-t border-slate-200 bg-[#1E2A3A] py-16 text-center">
        <h2 className="text-2xl font-bold text-white">지금 바로 시작하세요</h2>
        <p className="mt-3 text-slate-400">
          설문 설계부터 보고서까지, 연구의 모든 단계를 하나로.
        </p>
        <div className="mt-8">
          <Link href={isLoggedIn ? "/projects" : "/auth/signup"}>
            <Button
              size="lg"
              className="h-11 bg-white px-6 text-[15px] text-[#1E2A3A] hover:bg-slate-100"
            >
              {isLoggedIn ? "대시보드로 이동" : "무료로 시작하기"}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        &copy; 2025 H.Research. All rights reserved.
      </footer>
    </div>
  )
}
