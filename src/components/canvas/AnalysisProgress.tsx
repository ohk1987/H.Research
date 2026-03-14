"use client"

import { CheckCircle, Loader2, Circle } from "lucide-react"

export type AnalysisStep = "validate" | "structure" | "engine" | "process"
export type StepStatus = "done" | "running" | "pending"

interface AnalysisProgressProps {
  currentStep: AnalysisStep
  visible: boolean
}

const STEPS: { id: AnalysisStep; label: string }[] = [
  { id: "validate", label: "데이터 검증 중..." },
  { id: "structure", label: "모델 구조 파악 중..." },
  { id: "engine", label: "R 엔진 분석 중..." },
  { id: "process", label: "결과 처리 중..." },
]

function getStatus(stepId: AnalysisStep, currentStep: AnalysisStep): StepStatus {
  const order: AnalysisStep[] = ["validate", "structure", "engine", "process"]
  const currentIdx = order.indexOf(currentStep)
  const stepIdx = order.indexOf(stepId)
  if (stepIdx < currentIdx) return "done"
  if (stepIdx === currentIdx) return "running"
  return "pending"
}

export default function AnalysisProgress({ currentStep, visible }: AnalysisProgressProps) {
  if (!visible) return null

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="w-72 rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-sm font-semibold text-[#1E2A3A]">분석 실행 중</h3>
        <div className="flex flex-col gap-3">
          {STEPS.map((step) => {
            const status = getStatus(step.id, currentStep)
            return (
              <div key={step.id} className="flex items-center gap-3">
                {status === "done" && <CheckCircle className="size-4 shrink-0 text-emerald-500" />}
                {status === "running" && <Loader2 className="size-4 shrink-0 animate-spin text-[#1E2A3A]" />}
                {status === "pending" && <Circle className="size-4 shrink-0 text-slate-200" />}
                <span
                  className={`text-sm ${
                    status === "done"
                      ? "text-emerald-600"
                      : status === "running"
                        ? "font-medium text-[#1E2A3A]"
                        : "text-slate-300"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
