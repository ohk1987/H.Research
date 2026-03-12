// Claude API를 사용한 보조 해석 엔진

export interface AnalysisContext {
  projectName: string
  analysisType: 'cfa' | 'sem' | 'mediation' | 'moderation'
  variables: string[]
  fitMeasures?: Record<string, number>
  paths?: { from: string; to: string; beta: number; p: number }[]
}

const SYSTEM_PROMPT = `당신은 사회과학 논문 통계 결과를 한국어 학술 문체로 해석하는 전문가입니다.
APA 7판 형식을 준수하고, 통계 수치(β, SE, p, CI)를 정확하게 포함하며,
논문 방법론 섹션에 직접 사용할 수 있는 수준의 문장을 작성합니다.
과도한 수식어 없이 간결하고 정확하게 서술합니다.
다음 규칙을 따릅니다:
1. 소수점 셋째 자리까지 표기 (예: β=.523)
2. 유의수준은 p<.001, p<.01, p<.05 형태로 표기
3. 95% 신뢰구간은 [하한, 상한] 형태로 표기
4. 효과크기 해석 포함 (Cohen 기준)
5. 학술 논문에 바로 삽입 가능한 수준의 문체 유지`

export async function enhanceInterpretation(
  templateResult: string,
  analysisContext: AnalysisContext
): Promise<string> {
  const response = await fetch('/api/interpret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateResult, analysisContext }),
  })

  if (!response.ok) {
    // Claude API 실패 시 템플릿 결과 그대로 반환
    return templateResult
  }

  const data = await response.json()
  return data.interpretation || templateResult
}

export { SYSTEM_PROMPT }
