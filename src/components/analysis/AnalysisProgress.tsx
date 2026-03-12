"use client"

import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, RotateCcw } from "lucide-react"

export type AnalysisStatus = 'idle' | 'running' | 'completed' | 'failed'

interface AnalysisProgressProps {
  status: AnalysisStatus
  step: string
  error?: string | null
  onRetry?: () => void
}

export default function AnalysisProgress({
  status,
  step,
  error,
  onRetry,
}: AnalysisProgressProps) {
  if (status === 'idle') return null

  return (
    <div className="rounded-lg border p-4">
      {status === 'running' && (
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">분석 중...</p>
            <p className="text-xs text-muted-foreground">{step}</p>
          </div>
          <div className="ml-auto h-2 w-32 overflow-hidden rounded-full bg-muted">
            <div className="h-full animate-pulse rounded-full bg-primary" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {status === 'completed' && (
        <div className="flex items-center gap-3">
          <CheckCircle className="size-5 text-green-500" />
          <div>
            <p className="text-sm font-medium text-green-700">분석 완료</p>
            <p className="text-xs text-muted-foreground">{step}</p>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="flex items-center gap-3">
          <XCircle className="size-5 text-destructive" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">분석 실패</p>
            <p className="text-xs text-muted-foreground">
              {error || '알 수 없는 오류가 발생했습니다.'}
            </p>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCcw className="size-3.5" />
              재시도
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
