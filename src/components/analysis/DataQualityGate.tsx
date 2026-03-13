"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react"

interface QualityCheck {
  label: string
  status: "pass" | "warning" | "error"
  detail: string
}

interface DataQualityGateProps {
  data: Record<string, number[]> | null
  analysisType: "cfa" | "sem" | "efa" | "ttest" | "anova" | "hlm"
  onProceed: () => void
  onCancel: () => void
}

// 분석 유형별 최소 표본 크기
const MIN_SAMPLE_SIZES: Record<string, number> = {
  cfa: 100,
  sem: 100,
  efa: 50,
  ttest: 30,
  anova: 30,
  hlm: 50,
}

export default function DataQualityGate({
  data,
  analysisType,
  onProceed,
  onCancel,
}: DataQualityGateProps) {
  const [expanded, setExpanded] = useState(true)

  if (!data) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center gap-3 py-4">
          <XCircle className="size-5 text-destructive" />
          <p className="text-sm">데이터가 없습니다. 먼저 데이터를 업로드하세요.</p>
        </CardContent>
      </Card>
    )
  }

  const columns = Object.keys(data)
  const nRows = columns.length > 0 ? data[columns[0]].length : 0
  const minSample = MIN_SAMPLE_SIZES[analysisType] ?? 50

  // 품질 체크 실행
  const checks: QualityCheck[] = []

  // 1. 표본 크기
  checks.push({
    label: "표본 크기",
    status: nRows >= minSample ? "pass" : nRows >= minSample / 2 ? "warning" : "error",
    detail: `${nRows}행 (${analysisType.toUpperCase()} 최소 기준: ${minSample})`,
  })

  // 2. 결측치 비율
  let maxMissing = 0
  let maxMissingCol = ""
  columns.forEach((col) => {
    const missing = data[col].filter((v) => v === null || v === undefined || isNaN(v)).length
    const ratio = nRows > 0 ? missing / nRows : 0
    if (ratio > maxMissing) {
      maxMissing = ratio
      maxMissingCol = col
    }
  })
  checks.push({
    label: "결측치 비율",
    status: maxMissing < 0.05 ? "pass" : maxMissing < 0.1 ? "warning" : "error",
    detail: maxMissing > 0
      ? `최대 ${(maxMissing * 100).toFixed(1)}% (${maxMissingCol})`
      : "결측치 없음",
  })

  // 3. 정규성 (왜도·첨도)
  let normalityIssues = 0
  columns.forEach((col) => {
    const vals = data[col].filter((v) => !isNaN(v))
    if (vals.length < 3) return
    const n = vals.length
    const mean = vals.reduce((a, b) => a + b, 0) / n
    const m2 = vals.reduce((a, v) => a + (v - mean) ** 2, 0) / n
    const m3 = vals.reduce((a, v) => a + (v - mean) ** 3, 0) / n
    const sd = Math.sqrt(m2)
    if (sd === 0) return
    const skewness = m3 / (sd ** 3)
    const m4 = vals.reduce((a, v) => a + (v - mean) ** 4, 0) / n
    const kurtosis = m4 / (sd ** 4) - 3
    if (Math.abs(skewness) > 2 || Math.abs(kurtosis) > 7) normalityIssues++
  })
  checks.push({
    label: "정규성 (왜도<2, 첨도<7)",
    status: normalityIssues === 0 ? "pass" : normalityIssues <= 2 ? "warning" : "error",
    detail: normalityIssues === 0
      ? "모든 변수 기준 충족"
      : `${normalityIssues}개 변수 기준 초과`,
  })

  // 4. 변수 수
  checks.push({
    label: "변수 수",
    status: columns.length >= 3 ? "pass" : "warning",
    detail: `${columns.length}개 변수`,
  })

  const hasError = checks.some((c) => c.status === "error")
  const hasWarning = checks.some((c) => c.status === "warning")

  const StatusIcon = ({ status }: { status: QualityCheck["status"] }) => {
    if (status === "pass") return <CheckCircle className="size-4 text-green-500" />
    if (status === "warning") return <AlertTriangle className="size-4 text-yellow-500" />
    return <XCircle className="size-4 text-destructive" />
  }

  return (
    <Card className={hasError ? "border-destructive/50" : hasWarning ? "border-yellow-300" : "border-green-300"}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            {hasError ? (
              <XCircle className="size-4 text-destructive" />
            ) : hasWarning ? (
              <AlertTriangle className="size-4 text-yellow-500" />
            ) : (
              <CheckCircle className="size-4 text-green-500" />
            )}
            데이터 품질 검사
            <Badge variant={hasError ? "destructive" : hasWarning ? "secondary" : "default"}>
              {hasError ? "주의 필요" : hasWarning ? "경고 있음" : "통과"}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          <div className="mb-4 flex flex-col gap-2">
            {checks.map((check) => (
              <div key={check.label} className="flex items-center gap-2 text-sm">
                <StatusIcon status={check.status} />
                <span className="w-40 font-medium">{check.label}</span>
                <span className="text-muted-foreground">{check.detail}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              취소
            </Button>
            {hasError && nRows < 50 ? (
              <Button size="sm" disabled>
                진행 불가 (표본 부족)
              </Button>
            ) : (
              <Button size="sm" onClick={onProceed}>
                {hasWarning || hasError ? "그래도 진행" : "분석 진행"}
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
