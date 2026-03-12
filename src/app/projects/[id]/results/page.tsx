"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, ChevronDown, ArrowLeft } from "lucide-react"
import { Packer } from "docx"
import { saveAs } from "file-saver"

import APATable from "@/components/results/APATable"
import FitIndexTable from "@/components/results/FitIndexTable"
import PathTable from "@/components/results/PathTable"
import InterpretationBlock from "@/components/results/InterpretationBlock"
import ShareButton from "@/components/results/ShareButton"

import { useProjectStore } from "@/lib/store/project-store"
import {
  interpretReliability,
  interpretCFAFit,
  interpretConvergentValidity,
  interpretPathCoefficient,
  type FitMeasures,
  type PathResult,
} from "@/lib/interpretation/templates"
import { enhanceInterpretation } from "@/lib/interpretation/claude-interpreter"
import { generateWordDocument } from "@/lib/export/word-exporter"
import { generatePDF } from "@/lib/export/pdf-exporter"

type ResultTab = 'measurement' | 'structural' | 'mediation'

// 데모용 분석 결과 (실제로는 Supabase에서 가져올 예정)
const DEMO_FIT: FitMeasures = {
  cfi: 0.961,
  tli: 0.953,
  rmsea: 0.048,
  'rmsea.ci.lower': 0.031,
  'rmsea.ci.upper': 0.064,
  srmr: 0.042,
}

const DEMO_RELIABILITIES = [
  { variableName: '직무만족', alpha: 0.871 },
  { variableName: '조직몰입', alpha: 0.893 },
  { variableName: '이직의도', alpha: 0.845 },
]

const DEMO_AVE_CR = [
  { variable: '직무만족', ave: 0.542, cr: 0.825 },
  { variable: '조직몰입', ave: 0.587, cr: 0.851 },
  { variable: '이직의도', ave: 0.513, cr: 0.808 },
]

const DEMO_PATHS: PathResult[] = [
  { from: '직무만족', to: '조직몰입', beta: 0.523, se: 0.078, pValue: 0.0001, ci: [0.370, 0.676] },
  { from: '조직몰입', to: '이직의도', beta: -0.412, se: 0.085, pValue: 0.0001, ci: [-0.579, -0.245] },
  { from: '직무만족', to: '이직의도', beta: -0.187, se: 0.092, pValue: 0.042, ci: [-0.367, -0.007] },
]

export default function ResultsPage() {
  const params = useParams()
  const projectId = params.id as string
  const projectName = useProjectStore((s) => s.projectName) || '연구 프로젝트'

  const [activeTab, setActiveTab] = useState<ResultTab>('measurement')
  const [showExportMenu, setShowExportMenu] = useState(false)

  // 해석 텍스트 생성
  const measurementInterpretation = [
    ...DEMO_RELIABILITIES.map((r) => interpretReliability(r.alpha, r.variableName)),
    '',
    interpretCFAFit(DEMO_FIT),
    '',
    ...DEMO_AVE_CR.map((item) => interpretConvergentValidity(item.variable, item.ave, item.cr)),
  ].join('\n')

  const structuralInterpretation = DEMO_PATHS.map((p) =>
    interpretPathCoefficient(p.from, p.to, p.beta, p.se, p.pValue, p.ci)
  ).join('\n')

  // Word 다운로드
  const handleExportWord = useCallback(async () => {
    const doc = generateWordDocument({
      projectName,
      reliabilities: DEMO_RELIABILITIES,
      fitMeasures: DEMO_FIT,
      aveCrList: DEMO_AVE_CR,
      paths: DEMO_PATHS,
      interpretation: measurementInterpretation + '\n\n' + structuralInterpretation,
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `${projectName}_분석결과.docx`)
    setShowExportMenu(false)
  }, [projectName, measurementInterpretation, structuralInterpretation])

  // PDF 다운로드
  const handleExportPDF = useCallback(() => {
    const doc = generatePDF({
      projectName,
      reliabilities: DEMO_RELIABILITIES,
      fitMeasures: DEMO_FIT,
      aveCrList: DEMO_AVE_CR,
      paths: DEMO_PATHS,
      interpretation: measurementInterpretation + '\n\n' + structuralInterpretation,
    })

    doc.save(`${projectName}_분석결과.pdf`)
    setShowExportMenu(false)
  }, [projectName, measurementInterpretation, structuralInterpretation])

  // Claude AI 해석 다듬기
  const handleEnhanceMeasurement = useCallback(async () => {
    return enhanceInterpretation(measurementInterpretation, {
      projectName,
      analysisType: 'cfa',
      variables: DEMO_RELIABILITIES.map((r) => r.variableName),
      fitMeasures: DEMO_FIT as unknown as Record<string, number>,
    })
  }, [measurementInterpretation, projectName])

  const handleEnhanceStructural = useCallback(async () => {
    return enhanceInterpretation(structuralInterpretation, {
      projectName,
      analysisType: 'sem',
      variables: DEMO_PATHS.map((p) => p.from),
      paths: DEMO_PATHS.map((p) => ({ from: p.from, to: p.to, beta: p.beta, p: p.pValue })),
    })
  }, [structuralInterpretation, projectName])

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 헤더 */}
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${projectId}/analysis`}>
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">분석 결과</h1>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton projectId={projectId} />
            <div className="relative">
              <Button onClick={() => setShowExportMenu(!showExportMenu)}>
                <Download className="size-4" />
                보고서 다운로드
                <ChevronDown className="size-3.5" />
              </Button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border bg-card p-1 shadow-lg">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                      onClick={handleExportWord}
                    >
                      Word (.docx)
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                      onClick={handleExportPDF}
                    >
                      PDF (.pdf)
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 탭 */}
      <div className="border-b">
        <div className="mx-auto flex max-w-6xl px-6">
          {([
            { key: 'measurement' as const, label: '측정모형 결과' },
            { key: 'structural' as const, label: '구조모형 결과' },
            { key: 'mediation' as const, label: '매개/조절 결과' },
          ]).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* 탭 1: 측정모형 */}
        {activeTab === 'measurement' && (
          <div className="flex flex-col gap-6">
            {/* 신뢰도 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">신뢰도 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <APATable
                  title="Table 1. 신뢰도 분석 결과"
                  headers={['변수', "Cronbach's α", '평가']}
                  rows={DEMO_RELIABILITIES.map((r) => [
                    r.variableName,
                    r.alpha,
                    r.alpha >= 0.7 ? '양호' : '미흡',
                  ])}
                  note="α>.70을 기준으로 판단하였다."
                />
              </CardContent>
            </Card>

            {/* CFA 적합도 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">확인적 요인분석 (CFA)</CardTitle>
              </CardHeader>
              <CardContent>
                <FitIndexTable fitMeasures={DEMO_FIT} />
              </CardContent>
            </Card>

            {/* AVE/CR */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">수렴·판별 타당도</CardTitle>
              </CardHeader>
              <CardContent>
                <APATable
                  title="Table 3. 수렴타당도 분석 결과"
                  headers={['변수', 'AVE', 'CR', '판정']}
                  rows={DEMO_AVE_CR.map((item) => [
                    item.variable,
                    item.ave,
                    item.cr,
                    item.ave >= 0.5 && item.cr >= 0.7 ? '충족' : '미달',
                  ])}
                  note="AVE>.50, CR>.70을 기준으로 판단하였다."
                />
              </CardContent>
            </Card>

            {/* 한국어 해석 */}
            <InterpretationBlock
              text={measurementInterpretation}
              onEnhance={handleEnhanceMeasurement}
            />
          </div>
        )}

        {/* 탭 2: 구조모형 */}
        {activeTab === 'structural' && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">경로계수 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <PathTable paths={DEMO_PATHS} />
              </CardContent>
            </Card>

            <InterpretationBlock
              text={structuralInterpretation}
              onEnhance={handleEnhanceStructural}
            />
          </div>
        )}

        {/* 탭 3: 매개/조절 */}
        {activeTab === 'mediation' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground">매개/조절 분석 결과가 없습니다.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                캔버스에서 매개/조절 경로를 설정한 후 분석을 실행하세요.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
