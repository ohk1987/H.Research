"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Loader2, Info } from "lucide-react"
import InterpretationBlock from "@/components/results/InterpretationBlock"

// Hayes PROCESS 모형 번호 매핑
const PROCESS_MODELS = [
  { number: 4, label: '단순매개 (Model 4)', description: 'X → M → Y' },
  { number: 7, label: '조건부매개 (Model 7)', description: 'X → M → Y, W moderates X→M' },
  { number: 8, label: '조건부매개 (Model 8)', description: 'X → M → Y, W moderates X→Y and X→M' },
  { number: 14, label: '조건부매개 (Model 14)', description: 'X → M → Y, W moderates M→Y' },
  { number: 58, label: '이중매개 (Model 58)', description: 'X → M1 → M2 → Y' },
  { number: 6, label: '직렬매개 (Model 6)', description: 'X → M1 → M2 → Y (serial)' },
] as const

interface ProcessModelPanelProps {
  variables: string[]
  onRunAnalysis: (config: {
    modelNumber: number
    x: string
    y: string
    m: string
    w?: string
    m2?: string
    bootstrap: number
  }) => Promise<Record<string, unknown>>
}

export default function ProcessModelPanel({ variables, onRunAnalysis }: ProcessModelPanelProps) {
  const [modelNumber, setModelNumber] = useState(4)
  const [x, setX] = useState('')
  const [y, setY] = useState('')
  const [m, setM] = useState('')
  const [w, setW] = useState('')
  const [m2, setM2] = useState('')
  const [bootstrap, setBootstrap] = useState(5000)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  const selectedModel = PROCESS_MODELS.find((pm) => pm.number === modelNumber)
  const needsW = [7, 8, 14].includes(modelNumber)
  const needsM2 = [6, 58].includes(modelNumber)

  const handleRun = useCallback(async () => {
    if (!x || !y || !m) {
      setError('X, Y, M 변수를 모두 선택하세요.')
      return
    }
    if (needsW && !w) {
      setError('조절변수(W)를 선택하세요.')
      return
    }

    setRunning(true)
    setError('')
    setResult(null)

    try {
      const res = await onRunAnalysis({
        modelNumber, x, y, m,
        w: needsW ? w : undefined,
        m2: needsM2 ? m2 : undefined,
        bootstrap,
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.')
    } finally {
      setRunning(false)
    }
  }, [modelNumber, x, y, m, w, m2, bootstrap, needsW, needsM2, onRunAnalysis])

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">PROCESS Macro 분석</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* 모형 선택 */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">모형 번호</span>
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={modelNumber}
              onChange={(e) => setModelNumber(Number(e.target.value))}
            >
              {PROCESS_MODELS.map((pm) => (
                <option key={pm.number} value={pm.number}>
                  {pm.label}
                </option>
              ))}
            </select>
          </label>

          {selectedModel && (
            <div className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2">
              <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{selectedModel.description}</span>
            </div>
          )}

          {/* 변수 설정 */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">독립변수 (X)</span>
              <select className="rounded-md border bg-background px-3 py-1.5 text-sm" value={x} onChange={(e) => setX(e.target.value)}>
                <option value="">선택...</option>
                {variables.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">종속변수 (Y)</span>
              <select className="rounded-md border bg-background px-3 py-1.5 text-sm" value={y} onChange={(e) => setY(e.target.value)}>
                <option value="">선택...</option>
                {variables.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">매개변수 (M)</span>
              <select className="rounded-md border bg-background px-3 py-1.5 text-sm" value={m} onChange={(e) => setM(e.target.value)}>
                <option value="">선택...</option>
                {variables.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            {needsW && (
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">조절변수 (W)</span>
                <select className="rounded-md border bg-background px-3 py-1.5 text-sm" value={w} onChange={(e) => setW(e.target.value)}>
                  <option value="">선택...</option>
                  {variables.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            )}
            {needsM2 && (
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">매개변수 2 (M2)</span>
                <select className="rounded-md border bg-background px-3 py-1.5 text-sm" value={m2} onChange={(e) => setM2(e.target.value)}>
                  <option value="">선택...</option>
                  {variables.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            )}
          </div>

          {/* 부트스트랩 */}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">부트스트랩</span>
            <select className="rounded-md border bg-background px-3 py-1.5 text-sm" value={bootstrap} onChange={(e) => setBootstrap(Number(e.target.value))}>
              <option value={1000}>1,000</option>
              <option value={5000}>5,000 (권장)</option>
              <option value={10000}>10,000</option>
            </select>
          </label>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button onClick={handleRun} disabled={running} className="w-full">
            {running ? (
              <><Loader2 className="size-4 animate-spin" /> 분석 중...</>
            ) : (
              <><Play className="size-4" /> PROCESS 분석 실행</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 결과 */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">PROCESS Model {modelNumber} 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
