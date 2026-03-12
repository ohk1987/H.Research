import * as XLSX from 'xlsx'
import type { ParsedFileData } from '@/types/variables'

// Excel 파일 파싱 (.xlsx, .xls)
function parseExcel(buffer: ArrayBuffer): ParsedFileData {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: null,
  })

  if (jsonData.length === 0) {
    return { headers: [], rows: [], rowCount: 0 }
  }

  const headers = (jsonData[0] as (string | number | null)[]).map((h) =>
    String(h ?? '')
  )
  const rows = jsonData.slice(1)

  return { headers, rows, rowCount: rows.length }
}

// CSV 파일 파싱
function parseCSV(text: string): ParsedFileData {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')

  if (lines.length === 0) {
    return { headers: [], rows: [], rowCount: 0 }
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0])
  const rows = lines.slice(1).map((line) => {
    const values = parseLine(line)
    return values.map((v) => {
      if (v === '' || v === null) return null
      const num = Number(v)
      return isNaN(num) ? v : num
    })
  })

  return { headers, rows, rowCount: rows.length }
}

// 파일 확장자별 파싱 분기
export async function parseFile(file: File): Promise<ParsedFileData> {
  const extension = file.name.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'xlsx':
    case 'xls': {
      const buffer = await file.arrayBuffer()
      return parseExcel(buffer)
    }
    case 'csv': {
      const text = await file.text()
      return parseCSV(text)
    }
    case 'sav':
      throw new Error('SPSS(.sav) 파일은 추후 지원 예정입니다.')
    default:
      throw new Error(`지원하지 않는 파일 형식입니다: .${extension}`)
  }
}

// 특정 컬럼의 샘플 값 추출 (최대 3개)
export function getSampleValues(
  data: ParsedFileData,
  columnIndex: number,
  count = 3
): (string | number)[] {
  const samples: (string | number)[] = []
  for (let i = 0; i < Math.min(count, data.rows.length); i++) {
    const value = data.rows[i][columnIndex]
    if (value !== null && value !== undefined) {
      samples.push(value)
    }
  }
  return samples
}
