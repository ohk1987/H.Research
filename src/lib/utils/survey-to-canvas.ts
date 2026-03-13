import type { SurveyResponseItem } from '@/types/survey'
import type { SurveyQuestion } from '@/types/survey'
import type { LatentVariable } from '@/types/variables'

interface ConvertResult {
  headers: string[]
  rows: (string | number | null)[][]
  hasGroups: boolean
}

interface AutoConnectOptions {
  autoCreateNodes: boolean
  groupColumn: boolean
  reverseCode: boolean
  computeLatentMeans: boolean
}

interface AutoConnectResult {
  headers: string[]
  rows: (string | number | null)[][]
  nodePositions: Record<string, { x: number; y: number }>
  columnMapping: Record<string, string>
  warnings: string[]
}

// 설문 응답을 분석용 데이터셋으로 변환
export function convertSurveyToDataset(
  responses: {
    id: string
    groupId: string | null
    items: SurveyResponseItem[]
  }[],
  questions: SurveyQuestion[]
): ConvertResult {
  // 문항 ID → 컬럼명 매핑
  const questionMap = new Map(
    questions.map((q) => [q.id, q])
  )

  // 헤더 생성
  const questionHeaders = questions
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((q) => `q${q.orderIndex + 1}`)

  // group_id 존재 여부 확인
  const hasGroups = responses.some((r) => r.groupId !== null)
  const headers = hasGroups
    ? ['group_id', ...questionHeaders]
    : questionHeaders

  // 행 데이터 생성
  const rows = responses.map((response) => {
    const itemMap = new Map(
      response.items.map((item) => [item.questionId, item])
    )

    const values: (string | number | null)[] = []

    // group_id 컬럼
    if (hasGroups) {
      values.push(response.groupId ?? 'ungrouped')
    }

    // 문항별 값
    questions
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .forEach((q) => {
        const item = itemMap.get(q.id)
        if (!item) {
          values.push(null)
          return
        }

        let value: number | string | null = item.valueNumeric ?? item.valueText ?? null

        // 역문항 처리
        if (q.isReversed && typeof value === 'number') {
          value = q.scaleMax + q.scaleMin - value
        }

        values.push(value)
      })

    return values
  })

  return { headers, rows, hasGroups }
}

// 설문 데이터를 캔버스에 자동 연결
export function autoConnectSurveyToCanvas(
  convertResult: ConvertResult,
  latentVariables: LatentVariable[],
  options: AutoConnectOptions
): AutoConnectResult {
  const warnings: string[] = []
  const columnMapping: Record<string, string> = {}

  // 컬럼명 → 잠재변수 매핑 생성
  latentVariables.forEach((lv) => {
    lv.items.forEach((item) => {
      columnMapping[item.columnName] = lv.name
    })
  })

  // 매핑되지 않은 컬럼 경고
  const unmapped = convertResult.headers.filter(
    (h) => h !== 'group_id' && !columnMapping[h]
  )
  if (unmapped.length > 0) {
    warnings.push(`매핑되지 않은 변수: ${unmapped.join(', ')}`)
  }

  // 노드 자동 배치
  const nodePositions: Record<string, { x: number; y: number }> = {}

  if (options.autoCreateNodes) {
    const cols = 3
    const xGap = 300
    const yGap = 200
    const startX = 100
    const startY = 100

    // 색상별 분류: blue(독립)→왼쪽, green(종속)→오른쪽, 기타→중앙
    const independent = latentVariables.filter((v) => v.color === 'blue')
    const dependent = latentVariables.filter((v) => v.color === 'green')
    const mediator = latentVariables.filter((v) => v.color === 'yellow')
    const moderator = latentVariables.filter((v) => v.color === 'purple')
    const other = latentVariables.filter(
      (v) => !['blue', 'green', 'yellow', 'purple'].includes(v.color)
    )

    // 외생 (왼쪽)
    independent.forEach((v, i) => {
      nodePositions[v.id] = { x: startX, y: startY + i * yGap }
    })

    // 매개 (중앙)
    mediator.forEach((v, i) => {
      nodePositions[v.id] = { x: startX + xGap, y: startY + i * yGap }
    })

    // 조절 (중앙 상단)
    moderator.forEach((v, i) => {
      nodePositions[v.id] = {
        x: startX + xGap,
        y: startY + (mediator.length + i) * yGap,
      }
    })

    // 내생 (오른쪽)
    dependent.forEach((v, i) => {
      nodePositions[v.id] = { x: startX + xGap * 2, y: startY + i * yGap }
    })

    // 미분류 (격자 배열)
    other.forEach((v, i) => {
      const row = Math.floor(i / cols)
      const col = i % cols
      nodePositions[v.id] = {
        x: startX + col * xGap,
        y: startY + (Math.max(independent.length, dependent.length, mediator.length + moderator.length) + row) * yGap,
      }
    })
  }

  // 잠재변수 합산 평균 계산
  if (options.computeLatentMeans) {
    const headers = [...convertResult.headers]
    const rows = convertResult.rows.map((row) => [...row])

    latentVariables.forEach((lv) => {
      const colHeader = `${lv.name}_mean`
      headers.push(colHeader)
      const colIndices = lv.items
        .map((item) => convertResult.headers.indexOf(item.columnName))
        .filter((idx) => idx >= 0)

      rows.forEach((row) => {
        const values = colIndices
          .map((idx) => row[idx])
          .filter((v): v is number => typeof v === 'number' && !isNaN(v))
        row.push(values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null)
      })
    })

    return { headers, rows, nodePositions, columnMapping, warnings }
  }

  return {
    headers: convertResult.headers,
    rows: convertResult.rows,
    nodePositions,
    columnMapping,
    warnings,
  }
}
