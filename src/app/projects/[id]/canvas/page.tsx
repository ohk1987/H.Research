"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { ReactFlowProvider } from "@xyflow/react"

// SSR 비활성화 — React Flow는 브라우저 전용
const ModelCanvas = dynamic(
  () => import("@/components/canvas/ModelCanvas"),
  { ssr: false }
)

export default function CanvasPage() {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* 헤더 */}
      <header className="border-b">
        <div className="flex items-center justify-between px-6 py-3">
          <Link href="/projects" className="text-xl font-bold">
            H.Research
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>1. 데이터 업로드</span>
            <span>&rarr;</span>
            <span>2. 변수 설정</span>
            <span>&rarr;</span>
            <span className="font-medium text-foreground">3. 캔버스</span>
          </div>
        </div>
      </header>

      {/* 캔버스 영역 */}
      <div className="flex-1 overflow-hidden">
        <ReactFlowProvider>
          <ModelCanvas />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
