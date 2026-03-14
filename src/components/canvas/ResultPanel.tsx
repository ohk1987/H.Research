"use client"

import { useState, useRef, useCallback } from "react"
import {
  ChevronUp,
  ChevronDown,
  GripHorizontal,
  Copy,
  Check,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FitMeasures, PathResult } from "@/lib/interpretation/templates"

// ─── 타입 ───
export interface AnalysisResultData {
  fit?: FitMeasures & { chi_sq_df?: number }
  paths?: PathResult[]
  reliability?: { variable: string; alpha: number; ave: number; cr: number }[]
  interpretation?: string
  indirectEffects?: {
    from: string
    through: string
    to: string
    beta: number
    se: number
    pValue: number
    ci: [number, number]
  }[]
}

interface ResultPanelProps {
  result: AnalysisResultData | null
  onRequestInterpretation?: () => void
  interpretationLoading?: boolean
}

type TabId = "fit" | "paths" | "reliability" | "interpretation"

// ─── 적합도 평가 ───
function fitCheck(value: number, threshold: number, direction: "gte" | "lte"): boolean {
  return direction === "gte" ? value >= threshold : value <= threshold
}

function FitIcon({ pass }: { pass: boolean }) {
  return <span className={pass ? "text-emerald-500" : "text-amber-500"}>{pass ? "✅" : "⚠️"}</span>
}

// ─── 메인 컴포넌트 ───
export default function ResultPanel({
  result,
  onRequestInterpretation,
  interpretationLoading,
}: ResultPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>("fit")
  const [panelHeight, setPanelHeight] = useState(320)
  const [copied, setCopied] = useState(false)
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null)

  // 패널 높이 드래그 조절
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dragRef.current = { startY: e.clientY, startHeight: panelHeight }

      function onMove(ev: MouseEvent) {
        if (!dragRef.current) return
        const diff = dragRef.current.startY - ev.clientY
        const next = Math.max(200, Math.min(600, dragRef.current.startHeight + diff))
        setPanelHeight(next)
      }
      function onUp() {
        dragRef.current = null
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
      }
      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
    },
    [panelHeight]
  )

  const tabs: { id: TabId; label: string }[] = [
    { id: "fit", label: "적합도" },
    { id: "paths", label: "경로계수" },
    { id: "reliability", label: "신뢰도·타당성" },
    { id: "interpretation", label: "해석" },
  ]

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // 결과 없음
  if (!result) {
    return (
      <div className="flex h-9 items-center justify-between border-t border-slate-200 bg-slate-50 px-4">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <span key={tab.id} className="text-xs text-slate-300">
              {tab.label}
            </span>
          ))}
        </div>
        <span className="text-xs text-slate-400">분석 실행 후 결과가 표시됩니다</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col border-t border-slate-200 bg-white">
      {/* 드래그 핸들 (펼쳤을 때) */}
      {expanded && (
        <div
          className="flex cursor-row-resize items-center justify-center py-1 hover:bg-slate-50"
          onMouseDown={handleDragStart}
        >
          <GripHorizontal className="size-4 text-slate-300" />
        </div>
      )}

      {/* 탭 바 */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id)
                if (!expanded) setExpanded(true)
              }}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                expanded && activeTab === tab.id
                  ? "border-b-2 border-[#1E2A3A] text-[#1E2A3A]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          {expanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </button>
      </div>

      {/* 패널 내용 */}
      {expanded && (
        <div className="overflow-auto" style={{ height: panelHeight }}>
          {/* 탭 1: 적합도 */}
          {activeTab === "fit" && result.fit && (
            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                    <th className="pb-2 font-medium">지수</th>
                    <th className="pb-2 font-medium">값</th>
                    <th className="pb-2 font-medium">기준</th>
                    <th className="pb-2 font-medium">평가</th>
                  </tr>
                </thead>
                <tbody className="text-[#1E2A3A]">
                  <tr className="border-b border-slate-50">
                    <td className="py-2 font-medium">CFI</td>
                    <td className="py-2 font-mono">{result.fit.cfi.toFixed(3)}</td>
                    <td className="py-2 text-slate-500">≥ .90</td>
                    <td className="py-2"><FitIcon pass={fitCheck(result.fit.cfi, 0.9, "gte")} /></td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 font-medium">TLI</td>
                    <td className="py-2 font-mono">{result.fit.tli.toFixed(3)}</td>
                    <td className="py-2 text-slate-500">≥ .90</td>
                    <td className="py-2"><FitIcon pass={fitCheck(result.fit.tli, 0.9, "gte")} /></td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 font-medium">RMSEA</td>
                    <td className="py-2 font-mono">{result.fit.rmsea.toFixed(3)}</td>
                    <td className="py-2 text-slate-500">≤ .08</td>
                    <td className="py-2"><FitIcon pass={fitCheck(result.fit.rmsea, 0.08, "lte")} /></td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 font-medium">SRMR</td>
                    <td className="py-2 font-mono">{result.fit.srmr.toFixed(3)}</td>
                    <td className="py-2 text-slate-500">≤ .08</td>
                    <td className="py-2"><FitIcon pass={fitCheck(result.fit.srmr, 0.08, "lte")} /></td>
                  </tr>
                  {result.fit.chi_sq_df !== undefined && (
                    <tr>
                      <td className="py-2 font-medium">χ²/df</td>
                      <td className="py-2 font-mono">{result.fit.chi_sq_df.toFixed(3)}</td>
                      <td className="py-2 text-slate-500">≤ 3.0</td>
                      <td className="py-2"><FitIcon pass={fitCheck(result.fit.chi_sq_df, 3.0, "lte")} /></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 탭 2: 경로계수 */}
          {activeTab === "paths" && (
            <div className="p-4">
              {result.paths && result.paths.length > 0 ? (
                <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                        <th className="pb-2 font-medium">경로</th>
                        <th className="pb-2 font-medium">β</th>
                        <th className="pb-2 font-medium">SE</th>
                        <th className="pb-2 font-medium">t</th>
                        <th className="pb-2 font-medium">p</th>
                        <th className="pb-2 font-medium">유의</th>
                      </tr>
                    </thead>
                    <tbody className="text-[#1E2A3A]">
                      {[...result.paths]
                        .sort((a, b) => a.pValue - b.pValue)
                        .map((path, i) => {
                          const sig = path.pValue < 0.05
                          const t = path.se > 0 ? path.beta / path.se : 0
                          return (
                            <tr key={i} className="border-b border-slate-50">
                              <td className="py-2 font-medium">
                                {path.from} → {path.to}
                              </td>
                              <td className="py-2 font-mono">{path.beta.toFixed(3)}</td>
                              <td className="py-2 font-mono text-slate-500">{path.se.toFixed(3)}</td>
                              <td className="py-2 font-mono text-slate-500">{t.toFixed(3)}</td>
                              <td className="py-2 font-mono">
                                {path.pValue < 0.001 ? "<.001" : path.pValue.toFixed(3)}
                              </td>
                              <td className="py-2">
                                {sig ? (
                                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                                    {path.pValue < 0.01 ? "**" : "*"}
                                  </span>
                                ) : (
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                                    ns
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>

                  {/* 간접효과 */}
                  {result.indirectEffects && result.indirectEffects.length > 0 && (
                    <div className="mt-6">
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        간접효과 (매개)
                      </h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                            <th className="pb-2 font-medium">경로</th>
                            <th className="pb-2 font-medium">β</th>
                            <th className="pb-2 font-medium">95% CI</th>
                            <th className="pb-2 font-medium">유의</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#1E2A3A]">
                          {result.indirectEffects.map((ie, i) => (
                            <tr key={i} className="border-b border-slate-50">
                              <td className="py-2 font-medium">
                                {ie.from} → {ie.through} → {ie.to}
                              </td>
                              <td className="py-2 font-mono">{ie.beta.toFixed(3)}</td>
                              <td className="py-2 font-mono text-slate-500">
                                [{ie.ci[0].toFixed(3)}, {ie.ci[1].toFixed(3)}]
                              </td>
                              <td className="py-2">
                                {ie.pValue < 0.05 ? (
                                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                                    *
                                  </span>
                                ) : (
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                                    ns
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <p className="py-8 text-center text-sm text-slate-400">경로계수 데이터가 없습니다</p>
              )}
            </div>
          )}

          {/* 탭 3: 신뢰도·타당성 */}
          {activeTab === "reliability" && (
            <div className="p-4">
              {result.reliability && result.reliability.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                      <th className="pb-2 font-medium">변수</th>
                      <th className="pb-2 font-medium">α</th>
                      <th className="pb-2 font-medium">AVE</th>
                      <th className="pb-2 font-medium">CR</th>
                      <th className="pb-2 font-medium">판별</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#1E2A3A]">
                    {result.reliability.map((r) => (
                      <tr key={r.variable} className="border-b border-slate-50">
                        <td className="py-2 font-medium">{r.variable}</td>
                        <td className="py-2 font-mono">
                          <span className={r.alpha < 0.7 ? "text-amber-600 font-semibold" : ""}>
                            {r.alpha.toFixed(3)}
                          </span>
                        </td>
                        <td className="py-2 font-mono">
                          <span className={r.ave < 0.5 ? "text-amber-600 font-semibold" : ""}>
                            {r.ave.toFixed(3)}
                          </span>
                          {r.ave >= 0.5 ? " ✅" : " ⚠️"}
                        </td>
                        <td className="py-2 font-mono">
                          <span className={r.cr < 0.7 ? "text-amber-600 font-semibold" : ""}>
                            {r.cr.toFixed(3)}
                          </span>
                          {r.cr >= 0.7 ? " ✅" : " ⚠️"}
                        </td>
                        <td className="py-2">
                          {r.ave >= 0.5 ? (
                            <span className="text-emerald-500">✅</span>
                          ) : (
                            <span className="text-amber-500">⚠️</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="py-8 text-center text-sm text-slate-400">신뢰도·타당성 데이터가 없습니다</p>
              )}
            </div>
          )}

          {/* 탭 4: 한국어 해석 */}
          {activeTab === "interpretation" && (
            <div className="p-4">
              {result.interpretation ? (
                <div>
                  <div className="mb-3 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(result.interpretation ?? "")}
                    >
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copied ? "복사됨" : "복사"}
                    </Button>
                  </div>
                  <div className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-[#1E2A3A]">
                    {result.interpretation}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="mb-4 text-sm text-slate-400">한국어 해석이 생성되지 않았습니다</p>
                  {onRequestInterpretation && (
                    <Button
                      onClick={onRequestInterpretation}
                      disabled={interpretationLoading}
                    >
                      <Sparkles className="size-4" />
                      {interpretationLoading ? "생성 중..." : "Claude AI 해석 생성"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
