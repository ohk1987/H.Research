"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, FolderOpen } from "lucide-react"

export default function ProjectsPage() {
  // TODO: Supabase에서 프로젝트 목록 가져오기 (인증 연동 후)
  const projects: { id: string; title: string; status: string; updatedAt: string }[] = []

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold">
            H.Research
          </Link>
          <Link href="/projects/new">
            <Button>
              <Plus className="size-4" />
              새 프로젝트
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-semibold">프로젝트</h2>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FolderOpen className="mb-4 size-12 text-muted-foreground" />
              <p className="mb-2 text-lg font-medium">프로젝트가 없습니다</p>
              <p className="mb-6 text-sm text-muted-foreground">
                새 프로젝트를 만들어 통계 분석을 시작하세요.
              </p>
              <Link href="/projects/new">
                <Button>
                  <Plus className="size-4" />
                  새 프로젝트 만들기
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}/upload`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent>
                    <h3 className="font-medium">{project.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {project.updatedAt}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
