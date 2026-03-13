"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileText } from "lucide-react"
import { useProjectStore } from "@/lib/store/project-store"

export default function OnboardingPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const uploadedData = useProjectStore((s) => s.uploadedData)
  const latentVariables = useProjectStore((s) => s.latentVariables)

  // 이미 데이터나 변수가 있으면 프로젝트 홈으로 이동
  useEffect(() => {
    if (uploadedData || latentVariables.length > 0) {
      router.replace(`/projects/${projectId}`)
    }
  }, [uploadedData, latentVariables, projectId, router])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
          <Link href="/projects" className="text-xl font-bold">
            H.Research
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <h2 className="mb-2 text-2xl font-bold">새 프로젝트를 어떻게 시작하시겠어요?</h2>
        <p className="mb-8 text-muted-foreground">연구 데이터 준비 방식을 선택해주세요.</p>

        <div className="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
          <Card
            className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
            onClick={() => router.push(`/projects/${projectId}/upload`)}
          >
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-blue-50">
                <Upload className="size-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">기존 데이터 업로드</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Excel/CSV 파일이 있는 경우
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
            onClick={() => router.push(`/projects/${projectId}/variables`)}
          >
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-green-50">
                <FileText className="size-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">설문부터 설계하기</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  설문지를 만들어 데이터 수집
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
