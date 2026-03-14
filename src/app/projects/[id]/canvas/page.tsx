"use client"

import dynamic from "next/dynamic"
import { ReactFlowProvider } from "@xyflow/react"

// SSR 비활성화 — React Flow는 브라우저 전용
const ModelCanvas = dynamic(
  () => import("@/components/canvas/ModelCanvas"),
  { ssr: false }
)

export default function CanvasPage() {
  return (
    <div className="h-[calc(100vh-52px)] overflow-hidden">
      <ReactFlowProvider>
        <ModelCanvas />
      </ReactFlowProvider>
    </div>
  )
}
