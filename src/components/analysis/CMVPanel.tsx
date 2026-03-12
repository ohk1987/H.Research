"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import InterpretationBlock from "@/components/results/InterpretationBlock"
import { interpretCMV } from "@/lib/interpretation/templates"

interface CMVPanelProps {
  onRunAnalysis: () => Promise<{
    success: boolean
    harman: {
      first_factor_variance: number
      is_problematic: boolean
      interpretation: string
    }
    error?: string
  }>
}

export default function CMVPanel({ onRunAnalysis }: CMVPanelProps) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{
    first_factor_variance: number
    is_problematic: boolean
    interpretation: string
  } | null>(null)
  const [error, setError] = useState('')

  const handleRun = useCallback(async () => {
    setRunning(true)
    setError('')
    setResult(null)

    try {
      const res = await onRunAnalysis()
      if (!res.success) {
        setError(res.error ?? 'CMV 분석 중 오류가 발생했습니다.')
        return
      }
      setResult(res.harman)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CMV 분석 중 오류가 발생했습니다.')
    } finally {
      setRunning(false)
    }
  }, [onRunAnalysis])

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">동일방법편의 검증 (CMV)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            Harman의 단일요인 검정을 통해 동일방법편의를 검증합니다.
            단일요인이 전체 분산의 50% 이상을 설명하면 CMV가 우려됩니다.
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleRun} disabled={running} className="w-full">
            {running ? (
              <><Loader2 className="size-4 animate-spin" /> 분석 중...</>
            ) : (
              <><Play className="size-4" /> CMV 검증 실행</>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                {result.is_problematic ? (
                  <AlertTriangle className="size-8 text-amber-500" />
                ) : (
                  <CheckCircle className="size-8 text-green-600" />
                )}
                <div>
                  <p className="font-medium">
                    {result.is_problematic ? '동일방법편의 우려' : '동일방법편의 문제 없음'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    단일요인 설명 분산: {result.first_factor_variance.toFixed(1)}%
                    (기준: 50% 이하)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <InterpretationBlock
            text={interpretCMV(result.first_factor_variance, result.is_problematic)}
          />
        </>
      )}
    </div>
  )
}
