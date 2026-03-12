"use client"

import type { PathResult } from "@/lib/interpretation/templates"

interface PathTableProps {
  paths: PathResult[]
}

function formatP(p: number): string {
  if (p < 0.001) return '<.001'
  return p.toFixed(3).replace(/^0/, '')
}

export default function PathTable({ paths }: PathTableProps) {
  return (
    <div className="my-4">
      <p className="mb-2 text-sm font-semibold italic">Table. 경로계수 분석 결과</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-t-2 border-black">
              <th className="px-3 py-1.5 text-left font-semibold">경로</th>
              <th className="px-3 py-1.5 text-left font-semibold">β</th>
              <th className="px-3 py-1.5 text-left font-semibold">SE</th>
              <th className="px-3 py-1.5 text-left font-semibold">p</th>
              <th className="px-3 py-1.5 text-left font-semibold">95% CI</th>
            </tr>
          </thead>
          <tbody>
            {paths.map((path, idx) => (
              <tr key={idx} className="border-b border-gray-200 last:border-b-2 last:border-black">
                <td className="px-3 py-1.5 font-medium">
                  {path.from} → {path.to}
                </td>
                <td className={`px-3 py-1.5 font-mono ${path.pValue < 0.05 ? 'font-semibold' : ''}`}>
                  {path.beta.toFixed(3)}
                </td>
                <td className="px-3 py-1.5 font-mono text-muted-foreground">
                  {path.se.toFixed(3)}
                </td>
                <td className="px-3 py-1.5 font-mono">
                  {formatP(path.pValue)}
                  {path.pValue < 0.001 ? '***' : path.pValue < 0.01 ? '**' : path.pValue < 0.05 ? '*' : ''}
                </td>
                <td className="px-3 py-1.5 font-mono">
                  [{path.ci[0].toFixed(3)}, {path.ci[1].toFixed(3)}]
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-xs italic text-muted-foreground">
        <span className="font-semibold">Note.</span> β=표준화 경로계수; SE=표준오차; CI=신뢰구간. ***p&lt;.001, **p&lt;.01, *p&lt;.05.
      </p>
    </div>
  )
}
