export type VariableColor = 'blue' | 'green' | 'yellow' | 'purple'

export interface LatentVariable {
  id: string
  name: string
  color: VariableColor
  items: VariableItem[]
}

export interface VariableItem {
  id: string
  columnName: string
  isReversed: boolean
  sampleValues: (string | number)[]
}

export interface ParsedFileData {
  headers: string[]
  rows: (string | number | null)[][]
  rowCount: number
}
