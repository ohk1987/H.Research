"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProjectStore } from "@/lib/store/project-store"

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const setProject = useProjectStore((s) => s.setProject)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    // 임시 ID 생성 (Supabase 인증 연동 전)
    const tempId = `proj_${Date.now()}`
    setProject(tempId, name.trim())
    router.push(`/projects/${tempId}/onboarding`)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
          <Link href="/projects" className="text-xl font-bold">
            H.Research
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle>새 프로젝트 만들기</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="project-name" className="mb-1.5 block text-sm font-medium">
                  프로젝트 이름
                </label>
                <Input
                  id="project-name"
                  placeholder="예: 조직몰입 매개효과 연구"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={!name.trim()}>
                프로젝트 생성
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
