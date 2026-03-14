"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { ArrowRight } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.")
      return
    }

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.")
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push("/projects")
  }

  return (
    <div className="flex min-h-screen">
      {/* 좌: 브랜드 패널 */}
      <div className="hidden w-[45%] flex-col justify-between bg-[#1E2A3A] p-12 lg:flex">
        <Link href="/" className="text-xl font-bold text-white tracking-tight">
          H.Research
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-snug text-white">
            논문 수준의 분석을
            <br />
            누구나 쉽게.
          </h2>
          <p className="mt-4 text-slate-400 leading-relaxed">
            SPSS·AMOS 없이도 CFA, SEM, PROCESS,
            <br />
            PLS-SEM 분석을 웹에서 바로 실행하세요.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          &copy; 2025 H.Research
        </p>
      </div>

      {/* 우: 폼 패널 */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-10 block text-xl font-bold text-[#1E2A3A] lg:hidden">
            H.Research
          </Link>

          <h1 className="text-2xl font-bold text-[#1E2A3A]">회원가입</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            무료로 시작하세요. 카드 정보는 필요하지 않습니다.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#1E2A3A]">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-10"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#1E2A3A]">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="6자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-[#1E2A3A]">
                비밀번호 확인
              </label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="비밀번호 재입력"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-10"
              />
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="h-10 w-full">
              {loading ? "가입 중..." : "회원가입"}
              {!loading && <ArrowRight className="size-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            이미 계정이 있으신가요?{" "}
            <Link href="/auth/login" className="font-medium text-[#1E2A3A] hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
