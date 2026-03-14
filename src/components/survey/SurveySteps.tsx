"use client"

interface SurveyStepsProps {
  current: 1 | 2 | 3 | 4
}

const STEPS = [
  { num: 1, label: "문항 구성" },
  { num: 2, label: "설문 설정" },
  { num: 3, label: "수집 관리" },
  { num: 4, label: "응답 데이터" },
]

export default function SurveySteps({ current }: SurveyStepsProps) {
  return (
    <div className="flex items-center gap-1 text-sm">
      {STEPS.map((step, i) => (
        <span key={step.num} className="flex items-center gap-1">
          {i > 0 && <span className="mx-1 text-slate-300">→</span>}
          <span
            className={
              step.num === current
                ? "font-semibold text-[#1E2A3A]"
                : step.num < current
                  ? "text-slate-400"
                  : "text-slate-300"
            }
          >
            {step.num === current ? `● ${step.label}` : step.label}
          </span>
        </span>
      ))}
    </div>
  )
}
