"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileSpreadsheet, AlertCircle, ArrowRight, Database, Users, FlaskConical, Loader2 } from "lucide-react"
import { parseFile } from "@/lib/utils/file-parser"
import { useProjectStore } from "@/lib/store/project-store"
import type { ParsedFileData } from "@/types/variables"

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv", ".sav"]

interface SampleDataset {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  fileName: string
  n: number
  variables: number
  detail: string
}

const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: "moderated-mediation",
    label: "조절된 매개모형",
    description: "직무요구 → 직무소진 → 이직의도",
    icon: <FlaskConical className="size-5 text-blue-500" />,
    fileName: "dataset1_moderated_mediation.csv",
    n: 320,
    variables: 6,
    detail: "PROCESS Model 58, 6변수 36문항",
  },
  {
    id: "hlm-multilevel",
    label: "다층분석 (HLM)",
    description: "변혁적 리더십 → 혁신행동",
    icon: <Users className="size-5 text-emerald-500" />,
    fileName: "dataset2_hlm_multilevel.csv",
    n: 300,
    variables: 5,
    detail: "30팀, 교차수준 조절효과",
  },
  {
    id: "scale-validation",
    label: "척도개발·타당화",
    description: "연구자 디지털 리터러시 척도",
    icon: <Database className="size-5 text-purple-500" />,
    fileName: "dataset3_scale_validation.csv",
    n: 400,
    variables: 5,
    detail: "5요인 30문항, EFA/CFA 적합",
  },
]

// 잠재변수 자동 감지 설정
const VARIABLE_PRESETS: Record<string, { name: string; color: "blue" | "green" | "yellow" | "purple"; prefix: string; count: number; reverseItems: number[] }[]> = {
  "moderated-mediation": [
    { name: "직무요구", color: "blue", prefix: "jd", count: 6, reverseItems: [3, 5] },
    { name: "감정소진", color: "yellow", prefix: "ee", count: 6, reverseItems: [] },
    { name: "직무소진", color: "yellow", prefix: "dp", count: 5, reverseItems: [2] },
    { name: "심리적자본", color: "purple", prefix: "pc", count: 8, reverseItems: [4, 7] },
    { name: "사회적지지", color: "purple", prefix: "ss", count: 5, reverseItems: [] },
    { name: "이직의도", color: "green", prefix: "ti", count: 6, reverseItems: [5] },
  ],
  "hlm-multilevel": [
    { name: "자율성", color: "blue", prefix: "au", count: 4, reverseItems: [] },
    { name: "내재동기", color: "yellow", prefix: "im", count: 5, reverseItems: [3] },
    { name: "혁신행동", color: "green", prefix: "ib", count: 6, reverseItems: [] },
    { name: "변혁적리더십", color: "blue", prefix: "tl", count: 6, reverseItems: [] },
    { name: "팀심리안전감", color: "purple", prefix: "ps", count: 5, reverseItems: [] },
  ],
  "scale-validation": [
    { name: "정보탐색", color: "blue", prefix: "is", count: 6, reverseItems: [4] },
    { name: "데이터분석", color: "blue", prefix: "da", count: 6, reverseItems: [3, 5] },
    { name: "결과시각화", color: "yellow", prefix: "rv", count: 6, reverseItems: [] },
    { name: "협업소통", color: "green", prefix: "cc", count: 6, reverseItems: [2] },
    { name: "보안윤리", color: "purple", prefix: "se", count: 6, reverseItems: [5, 6] },
  ],
}

export default function UploadPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const setUploadedData = useProjectStore((s) => s.setUploadedData)
  const addLatentVariable = useProjectStore((s) => s.addLatentVariable)
  const assignItemToVariable = useProjectStore((s) => s.assignItemToVariable)
  const latentVariables = useProjectStore((s) => s.latentVariables)
  const [dragOver, setDragOver] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingSample, setLoadingSample] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setLoading(true)
    try {
      const data = await parseFile(file)
      setParsedData(data)
      setFileName(file.name)
      setFileSize(file.size)
      setUploadedData({ name: file.name, size: file.size }, data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "파일을 처리할 수 없습니다.")
      setParsedData(null)
    } finally {
      setLoading(false)
    }
  }, [setUploadedData])

  async function handleSampleLoad(dataset: SampleDataset) {
    setLoadingSample(dataset.id)
    setError(null)

    try {
      // CSV 파일 로드
      const response = await fetch(`/dummy-data/${dataset.fileName}`)
      if (!response.ok) throw new Error("샘플 데이터를 불러올 수 없습니다.")
      const csvText = await response.text()

      // CSV 파싱
      const lines = csvText.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',')
      const rows: (string | number | null)[][] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',')
        const row: (string | number | null)[] = values.map(v => {
          if (v === '') return null
          const num = Number(v)
          return isNaN(num) ? v : num
        })
        rows.push(row)
      }

      const data: ParsedFileData = {
        headers,
        rows,
        rowCount: rows.length,
      }

      // 스토어에 데이터 저장
      setUploadedData(
        { name: dataset.fileName, size: csvText.length },
        data
      )
      setParsedData(data)
      setFileName(dataset.fileName)
      setFileSize(csvText.length)

      // 잠재변수 자동 설정
      const presets = VARIABLE_PRESETS[dataset.id]
      if (presets && latentVariables.length === 0) {
        for (const preset of presets) {
          addLatentVariable(preset.name, preset.color)
        }

        // 약간의 딜레이 후 문항 할당 (스토어 업데이트 대기)
        await new Promise(resolve => setTimeout(resolve, 100))

        const currentVars = useProjectStore.getState().latentVariables
        for (let vi = 0; vi < presets.length; vi++) {
          const preset = presets[vi]
          const variable = currentVars[vi]
          if (!variable) continue

          for (let qi = 1; qi <= preset.count; qi++) {
            const colName = `${preset.prefix}${qi}`
            const colIdx = headers.indexOf(colName)
            const sampleValues: (string | number)[] = []
            for (let ri = 0; ri < Math.min(5, rows.length); ri++) {
              const val = rows[ri][colIdx]
              if (val !== null) sampleValues.push(val)
            }
            assignItemToVariable(variable.id, { columnName: colName, sampleValues })

            // 역문항 설정
            if (preset.reverseItems.includes(qi)) {
              const updatedVars = useProjectStore.getState().latentVariables
              const updatedVar = updatedVars.find(v => v.id === variable.id)
              const item = updatedVar?.items.find(i => i.columnName === colName)
              if (item) {
                useProjectStore.getState().toggleItemReverse(variable.id, item.id)
              }
            }
          }
        }
      }

      // 변수 설정 페이지로 이동
      router.push(`/projects/${projectId}/variables`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "샘플 데이터를 불러올 수 없습니다.")
    } finally {
      setLoadingSample(null)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/projects" className="text-xl font-bold">
            H.Research
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">1. 데이터 업로드</span>
            <span>→</span>
            <span>2. 변수 설정</span>
            <span>→</span>
            <span>3. 캔버스</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-semibold">데이터 업로드</h2>

        {/* 드래그앤드롭 영역 */}
        <Card
          className={`cursor-pointer transition-colors ${
            dragOver ? "border-primary bg-primary/5" : ""
          }`}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Upload className="mb-4 size-10 text-muted-foreground" />
            <p className="mb-2 text-lg font-medium">
              파일을 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-sm text-muted-foreground">
              지원 형식: Excel(.xlsx, .xls), CSV(.csv), SPSS(.sav)
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(",")}
              onChange={handleInputChange}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* 샘플 데이터 섹션 */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/50 p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#1E2A3A]">
              샘플 데이터로 먼저 체험해보세요
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              클릭하면 데이터와 변수가 자동 설정되어 즉시 분석을 시작할 수 있습니다
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {SAMPLE_DATASETS.map((dataset) => (
              <button
                key={dataset.id}
                type="button"
                onClick={() => handleSampleLoad(dataset)}
                disabled={loadingSample !== null}
                className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-4 text-center transition-all hover:border-[#1E2A3A]/30 hover:shadow-sm disabled:opacity-50"
              >
                {loadingSample === dataset.id ? (
                  <Loader2 className="mb-2 size-5 animate-spin text-[#1E2A3A]" />
                ) : (
                  <div className="mb-2">{dataset.icon}</div>
                )}
                <p className="text-sm font-semibold text-[#1E2A3A]">{dataset.label}</p>
                <p className="mt-1 text-[10px] text-slate-500">{dataset.description}</p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                  <span>n={dataset.n}</span>
                  <span>{dataset.variables}변수</span>
                </div>
                <p className="mt-1 text-[9px] text-slate-300">{dataset.detail}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            파일을 분석하고 있습니다...
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {/* 파일 미리보기 */}
        {parsedData && fileName && (
          <Card className="mt-6">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="size-8 text-primary" />
                <div>
                  <p className="font-medium">{fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(fileSize)} · {parsedData.rowCount}행 · {parsedData.headers.length}열
                  </p>
                </div>
              </div>
              <Button onClick={() => router.push(`/projects/${projectId}/variables`)}>
                다음 단계
                <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
