"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AnalysisOptions } from "@/types/analysis"
import { DEFAULT_OPTIONS } from "@/types/analysis"

interface AnalysisOptionsPanelProps {
  options: AnalysisOptions
  onChange: (options: AnalysisOptions) => void
}

export default function AnalysisOptionsPanel({ options, onChange }: AnalysisOptionsPanelProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card>
      <CardHeader>
        <button
          type="button"
          className="flex w-full items-center justify-between"
          onClick={() => setExpanded(!expanded)}
        >
          <CardTitle className="text-sm">분석 옵션</CardTitle>
          <span className="text-xs text-muted-foreground">
            {expanded ? '접기' : '펼치기'}
          </span>
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="flex flex-col gap-3">
          {/* 추정방법 */}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">추정방법 (Estimator)</span>
            <select
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
              value={options.estimator}
              onChange={(e) => onChange({ ...options, estimator: e.target.value as AnalysisOptions['estimator'] })}
            >
              <option value="ML">ML (최대우도법)</option>
              <option value="MLR">MLR (로버스트 ML)</option>
              <option value="WLSMV">WLSMV (범주형)</option>
            </select>
          </label>

          {/* 부트스트랩 */}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">부트스트랩 횟수</span>
            <select
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
              value={options.bootstrap}
              onChange={(e) => onChange({ ...options, bootstrap: Number(e.target.value) as AnalysisOptions['bootstrap'] })}
            >
              <option value={1000}>1,000</option>
              <option value={5000}>5,000 (권장)</option>
              <option value={10000}>10,000</option>
            </select>
          </label>

          {/* 신뢰구간 */}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">신뢰구간</span>
            <select
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
              value={options.confidenceInterval}
              onChange={(e) => onChange({ ...options, confidenceInterval: Number(e.target.value) as AnalysisOptions['confidenceInterval'] })}
            >
              <option value={90}>90%</option>
              <option value={95}>95% (기본)</option>
              <option value={99}>99%</option>
            </select>
          </label>

          {/* 결측 처리 */}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">결측 처리</span>
            <select
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
              value={options.missingData}
              onChange={(e) => onChange({ ...options, missingData: e.target.value as AnalysisOptions['missingData'] })}
            >
              <option value="fiml">FIML (완전정보 최대우도)</option>
              <option value="listwise">Listwise 삭제</option>
            </select>
          </label>

          {/* 기본값 복원 */}
          <button
            type="button"
            className="mt-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onChange(DEFAULT_OPTIONS)}
          >
            기본값으로 복원
          </button>
        </CardContent>
      )}
    </Card>
  )
}
