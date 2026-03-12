"use client"

interface APATableProps {
  title: string
  headers: string[]
  rows: (string | number)[][]
  note?: string
}

export default function APATable({ title, headers, rows, note }: APATableProps) {
  return (
    <div className="my-4">
      <p className="mb-2 text-sm font-semibold italic">{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-t-2 border-black">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-1.5 text-left font-semibold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-gray-200 last:border-b-2 last:border-black">
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className={`px-3 py-1.5 ${cellIdx === 0 ? 'font-medium' : 'font-mono'}`}
                  >
                    {typeof cell === 'number' ? cell.toFixed(3) : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && (
        <p className="mt-1 text-xs italic text-muted-foreground">
          <span className="font-semibold">Note.</span> {note}
        </p>
      )}
    </div>
  )
}
