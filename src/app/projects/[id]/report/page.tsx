"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Loader2, CheckCircle } from "lucide-react"
import { useProjectStore } from "@/lib/store/project-store"
import { Packer } from "docx"
import { saveAs } from "file-saver"
import { generateWordDocument } from "@/lib/export/word-exporter"
import { generatePDF } from "@/lib/export/pdf-exporter"
import {
  interpretReliability,
  interpretCFAFit,
  interpretConvergentValidity,
  interpretPathCoefficient,
  type FitMeasures,
  type PathResult,
} from "@/lib/interpretation/templates"

type ReportFormat = "apa-docx" | "kci-docx" | "pptx"

interface ReportSection {
  id: string
  label: string
  checked: boolean
}

// 데모 분석 결과 (실제로는 store/DB에서)
const DEMO_FIT: FitMeasures = {
  cfi: 0.961, tli: 0.953, rmsea: 0.048,
  "rmsea.ci.lower": 0.031, "rmsea.ci.upper": 0.064, srmr: 0.042,
}
const DEMO_RELIABILITIES = [
  { variableName: "직무만족", alpha: 0.871 },
  { variableName: "조직몰입", alpha: 0.893 },
  { variableName: "이직의도", alpha: 0.845 },
]
const DEMO_AVE_CR = [
  { variable: "직무만족", ave: 0.542, cr: 0.825 },
  { variable: "조직몰입", ave: 0.587, cr: 0.851 },
  { variable: "이직의도", ave: 0.513, cr: 0.808 },
]
const DEMO_PATHS: PathResult[] = [
  { from: "직무만족", to: "조직몰입", beta: 0.523, se: 0.078, pValue: 0.0001, ci: [0.370, 0.676] },
  { from: "조직몰입", to: "이직의도", beta: -0.412, se: 0.085, pValue: 0.0001, ci: [-0.579, -0.245] },
  { from: "직무만족", to: "이직의도", beta: -0.187, se: 0.092, pValue: 0.042, ci: [-0.367, -0.007] },
]

export default function ReportPage() {
  const params = useParams()
  const projectId = params.id as string
  const projectName = useProjectStore((s) => s.projectName) || "연구 프로젝트"

  const [format, setFormat] = useState<ReportFormat>("apa-docx")
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const [sections, setSections] = useState<ReportSection[]>([
    { id: "model", label: "연구 모형 및 가설", checked: true },
    { id: "descriptive", label: "기술통계 및 상관분석", checked: true },
    { id: "reliability", label: "신뢰도 및 타당성 분석 (\u03B1, AVE, CR)", checked: true },
    { id: "cfa", label: "측정 모형 (CFA 결과)", checked: true },
    { id: "sem", label: "구조 모형 (경로계수 표)", checked: true },
    { id: "fit", label: "모형적합도 지수 표", checked: true },
    { id: "mediation", label: "매개/조절 효과 (해당 시)", checked: false },
    { id: "interpretation", label: "한국어 해석 포함", checked: true },
  ])

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s))
    )
  }

  const selectedSections = sections.filter((s) => s.checked)

  // 해석 텍스트 생성
  const buildInterpretation = useCallback(() => {
    const parts: string[] = []

    if (sections.find((s) => s.id === "reliability")?.checked) {
      DEMO_RELIABILITIES.forEach((r) => {
        parts.push(interpretReliability(r.alpha, r.variableName))
      })
    }

    if (sections.find((s) => s.id === "cfa")?.checked) {
      parts.push("")
      parts.push(interpretCFAFit(DEMO_FIT))
    }

    if (sections.find((s) => s.id === "reliability")?.checked) {
      DEMO_AVE_CR.forEach((item) => {
        parts.push(interpretConvergentValidity(item.variable, item.ave, item.cr))
      })
    }

    if (sections.find((s) => s.id === "sem")?.checked) {
      parts.push("")
      DEMO_PATHS.forEach((p) => {
        parts.push(interpretPathCoefficient(p.from, p.to, p.beta, p.se, p.pValue, p.ci))
      })
    }

    return parts.join("\n")
  }, [sections])

  // 보고서 생성
  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    setGenerated(false)

    try {
      const interpretation = buildInterpretation()

      if (format === "apa-docx" || format === "kci-docx") {
        const doc = generateWordDocument({
          projectName,
          reliabilities: DEMO_RELIABILITIES,
          fitMeasures: DEMO_FIT,
          aveCrList: DEMO_AVE_CR,
          paths: DEMO_PATHS,
          interpretation,
        })
        const blob = await Packer.toBlob(doc)
        const suffix = format === "kci-docx" ? "_KCI" : "_APA"
        saveAs(blob, `${projectName}${suffix}_분석보고서.docx`)
      } else {
        // pptx — PDF로 대체 (pptx 라이브러리 추가 전)
        const doc = generatePDF({
          projectName,
          reliabilities: DEMO_RELIABILITIES,
          fitMeasures: DEMO_FIT,
          aveCrList: DEMO_AVE_CR,
          paths: DEMO_PATHS,
          interpretation,
        })
        doc.save(`${projectName}_분석보고서.pdf`)
      }

      setGenerated(true)
    } catch {
      // 에러 시 조용히 실패
    } finally {
      setGenerating(false)
    }
  }, [format, projectName, buildInterpretation])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${projectId}`}>
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">보고서 생성</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex flex-col gap-6">
          {/* 섹션 선택 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">보고서 구성 선택</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {sections.map((section) => (
                  <label
                    key={section.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={section.checked}
                      onChange={() => toggleSection(section.id)}
                      className="size-4 rounded border"
                    />
                    <span className="text-sm">{section.label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {selectedSections.length}개 섹션 선택됨
              </p>
            </CardContent>
          </Card>

          {/* 형식 선택 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">출력 형식</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {([
                  { value: "apa-docx" as const, label: "APA 논문 형식 (.docx)", desc: "APA 7판 양식, Times New Roman, 1인치 여백" },
                  { value: "kci-docx" as const, label: "한국 학술지 형식 (.docx)", desc: "KCI 등재지 투고 양식" },
                  { value: "pptx" as const, label: "발표 자료 형식 (.pdf)", desc: "주요 결과 요약 슬라이드" },
                ] as const).map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted"
                  >
                    <input
                      type="radio"
                      name="format"
                      checked={format === opt.value}
                      onChange={() => setFormat(opt.value)}
                      className="size-4"
                    />
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 생성 버튼 */}
          <div className="flex items-center justify-between">
            {generated && (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="size-3" />
                보고서 다운로드 완료
              </Badge>
            )}
            {!generated && <div />}
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={generating || selectedSections.length === 0}
            >
              {generating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  보고서 생성
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
