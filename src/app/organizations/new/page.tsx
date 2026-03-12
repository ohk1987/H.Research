"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function NewOrganizationPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [type, setType] = useState('university')
  const [creating, setCreating] = useState(false)

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      // TODO: Supabase 연동
      const orgId = `org_${Date.now()}`
      router.push(`/organizations/${orgId}`)
    } finally {
      setCreating(false)
    }
  }, [name, router])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center px-6 py-4">
          <Link href="/organizations">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="ml-3 text-xl font-bold">새 조직 만들기</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">조직 정보</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">조직 이름</span>
              <Input
                placeholder="예: 서울대학교 경영학과"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">조직 유형</span>
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="university">대학</option>
                <option value="institute">연구소</option>
                <option value="company">기업</option>
              </select>
            </label>

            <Button
              onClick={handleCreate}
              disabled={!name.trim() || creating}
              className="mt-2 w-full"
            >
              {creating ? '생성 중...' : '조직 생성'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
