"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Loader2, CheckCircle, XCircle } from "lucide-react"
import APATable from "@/components/results/APATable"

interface MGAPanelProps {
  variables: string[]
  onRunAnalysis: (config: {
    group: string
    estimator: string
  }) => Promise<Record<string, unknown>>
}

export default function MGAPanel({ variables, onRunAnalysis }: MGAPanelProps) {
  const [group, setGroup] = useState('')
  const [estimator, setEstimator] = useState('ML')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  const handleRun = useCallback(async () => {
    if (!group) {
      setError('집단변수를 선택하세요.')
      return
    }

    setRunning(true)
    setError('')
    setResult(null)

    try {
      const res = await onRunAnalysis({ group, estimator })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.')
    } finally {
      setRunning(false)
    }
  }, [group, estimator, onRunAnalysis])

  // ΔCFI 판정
  const deltaCfiOk = (val: number) => Math.abs(val) < 0.01

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">다중집단분석 (MGA)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">집단변수</span>
            <select
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            >
              <option value="">선택...</option>
              {variables.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">추정방법</span>
            <select
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
              value={estimator}
              onChange={(e) => setEstimator(e.target.value)}
            >
              <option value="ML">ML</option>
              <option value="MLR">MLR</option>
              <option value="WLSMV">WLSMV</option>
            </select>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleRun} disabled={running} className="w-full">
            {running ? (
              <><Loader2 className="size-4 animate-spin" /> 분석 중...</>
            ) : (
              <><Play className="size-4" /> MGA 분석 실행</>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">측정 동일성 검증 결과</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <APATable
              title="Table. 다중집단 측정 동일성 검증"
              headers={['모형', 'CFI', 'TLI', 'RMSEA', 'SRMR', 'ΔCFI', '판정']}
              rows={[
                [
                  '형태 동일성',
                  (result.configural as Record<string, number>)?.cfi ?? '-',
                  (result.configural as Record<string, number>)?.tli ?? '-',
                  (result.configural as Record<string, number>)?.rmsea ?? '-',
                  (result.configural as Record<string, number>)?.srmr ?? '-',
                  '-',
                  '-',
                ],
                [
                  '측정 동일성',
                  (result.metric as Record<string, number>)?.cfi ?? '-',
                  (result.metric as Record<string, number>)?.tli ?? '-',
                  (result.metric as Record<string, number>)?.rmsea ?? '-',
                  (result.metric as Record<string, number>)?.srmr ?? '-',
                  result.delta_cfi_metric as number,
                  deltaCfiOk(result.delta_cfi_metric as number) ? '충족' : '미달',
                ],
                [
                  '절편 동일성',
                  (result.scalar as Record<string, number>)?.cfi ?? '-',
                  (result.scalar as Record<string, number>)?.tli ?? '-',
                  (result.scalar as Record<string, number>)?.rmsea ?? '-',
                  (result.scalar as Record<string, number>)?.srmr ?? '-',
                  result.delta_cfi_scalar as number,
                  deltaCfiOk(result.delta_cfi_scalar as number) ? '충족' : '미달',
                ],
              ]}
              note="ΔCFI < .01 기준으로 동일성을 판단하였다 (Cheung & Rensvold, 2002)."
            />

            {/* 요약 판정 */}
            <div className="flex flex-col gap-2 rounded-md bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm">
                {deltaCfiOk(result.delta_cfi_metric as number) ? (
                  <CheckCircle className="size-4 text-green-600" />
                ) : (
                  <XCircle className="size-4 text-red-600" />
                )}
                <span>
                  측정 동일성: ΔCFI = {(result.delta_cfi_metric as number)?.toFixed(3)} →{' '}
                  {deltaCfiOk(result.delta_cfi_metric as number) ? '충족' : '미달'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {deltaCfiOk(result.delta_cfi_scalar as number) ? (
                  <CheckCircle className="size-4 text-green-600" />
                ) : (
                  <XCircle className="size-4 text-red-600" />
                )}
                <span>
                  절편 동일성: ΔCFI = {(result.delta_cfi_scalar as number)?.toFixed(3)} →{' '}
                  {deltaCfiOk(result.delta_cfi_scalar as number) ? '충족' : '미달'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
