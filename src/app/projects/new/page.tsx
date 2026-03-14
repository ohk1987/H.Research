"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useProjectStore } from "@/lib/store/project-store"

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const setProject = useProjectStore((s) => s.setProject)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const tempId = `proj_${Date.now()}`
    setProject(tempId, name.trim())
    router.push(`/projects/${tempId}/onboarding`)
  }

  return (
    <div className="flex items-center justify-center p-6" style={{ minHeight: "calc(100vh - 52px)" }}>
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="mb-1 text-lg font-bold text-[#1E2A3A]">새 프로젝트 만들기</h1>
          <p className="mb-6 text-sm text-slate-500">프로젝트 이름을 입력하세요.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="project-name" className="mb-1.5 block text-sm font-medium text-[#1E2A3A]">
                프로젝트 이름
              </label>
              <Input
                id="project-name"
                placeholder="예: 조직몰입 매개효과 연구"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="h-10"
              />
            </div>
            <Button type="submit" disabled={!name.trim()} className="h-10">
              프로젝트 생성
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
