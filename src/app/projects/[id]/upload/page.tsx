"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileSpreadsheet, AlertCircle, ArrowRight } from "lucide-react"
import { parseFile } from "@/lib/utils/file-parser"
import { useProjectStore } from "@/lib/store/project-store"
import type { ParsedFileData } from "@/types/variables"

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv", ".sav"]

export default function UploadPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const setUploadedData = useProjectStore((s) => s.setUploadedData)
  const [dragOver, setDragOver] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
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
