"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
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
    <div className="flex items-center justify-center p-6" style={{ minHeight: "calc(100vh - 52px)" }}>
      <div className="w-full max-w-2xl text-center">
        <h2 className="mb-2 text-2xl font-bold text-[#1E2A3A]">
          새 프로젝트를 어떻게 시작하시겠어요?
        </h2>
        <p className="mb-10 text-slate-500">연구 데이터 준비 방식을 선택해주세요.</p>

        <div className="grid gap-6 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push(`/projects/${projectId}/upload`)}
            className="group flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white py-10 transition-all hover:border-[#1E2A3A]/30 hover:shadow-md"
          >
            <div className="flex size-16 items-center justify-center rounded-full bg-blue-50 transition-colors group-hover:bg-blue-100">
              <Upload className="size-7 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1E2A3A]">기존 데이터 업로드</h3>
              <p className="mt-1 text-sm text-slate-500">Excel/CSV 파일이 있는 경우</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push(`/projects/${projectId}/variables`)}
            className="group flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white py-10 transition-all hover:border-[#1E2A3A]/30 hover:shadow-md"
          >
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50 transition-colors group-hover:bg-emerald-100">
              <FileText className="size-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1E2A3A]">설문부터 설계하기</h3>
              <p className="mt-1 text-sm text-slate-500">설문지를 만들어 데이터 수집</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
