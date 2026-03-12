import type { SurveyResponseItem } from '@/types/survey'
import type { SurveyQuestion } from '@/types/survey'

interface ConvertResult {
  headers: string[]
  rows: (string | number | null)[][]
  hasGroups: boolean
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
