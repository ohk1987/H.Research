"use client"

import type { FitMeasures } from "@/lib/interpretation/templates"

interface FitIndexTableProps {
  fitMeasures: FitMeasures
}

interface FitCriterion {
  name: string
  value: number
  criterion: string
  met: boolean
}

function getFitCriteria(fit: FitMeasures): FitCriterion[] {
  return [
    { name: 'CFI', value: fit.cfi, criterion: '>.95', met: fit.cfi >= 0.95 },
    { name: 'TLI', value: fit.tli, criterion: '>.95', met: fit.tli >= 0.95 },
    { name: 'RMSEA', value: fit.rmsea, criterion: '<.08', met: fit.rmsea <= 0.08 },
    { name: 'SRMR', value: fit.srmr, criterion: '<.08', met: fit.srmr <= 0.08 },
  ]
}

export default function FitIndexTable({ fitMeasures }: FitIndexTableProps) {
  const criteria = getFitCriteria(fitMeasures)

  return (
    <div className="my-4">
      <p className="mb-2 text-sm font-semibold italic">Table. 모형적합도 지수</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-t-2 border-black">
              <th className="px-3 py-1.5 text-left font-semibold">적합도 지수</th>
              <th className="px-3 py-1.5 text-left font-semibold">값</th>
              <th className="px-3 py-1.5 text-left font-semibold">기준</th>
              <th className="px-3 py-1.5 text-left font-semibold">평가</th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((c) => (
              <tr key={c.name} className="border-b border-gray-200 last:border-b-2 last:border-black">
                <td className="px-3 py-1.5 font-medium">{c.name}</td>
                <td className="px-3 py-1.5 font-mono">{c.value.toFixed(3)}</td>
                <td className="px-3 py-1.5 font-mono text-muted-foreground">{c.criterion}</td>
                <td className="px-3 py-1.5">{c.met ? '충족' : '미충족'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-xs italic text-muted-foreground">
        <span className="font-semibold">Note.</span> CFI=comparative fit index; TLI=Tucker-Lewis index; RMSEA=root mean square error of approximation; SRMR=standardized root mean square residual.
      </p>
    </div>
  )
}
