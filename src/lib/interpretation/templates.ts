// 규칙 기반 한국어 해석 템플릿 엔진
// APA 7판 학술 문체 준수, β·SE·p·95% CI 수치 포함

export interface FitMeasures {
  cfi: number
  tli: number
  rmsea: number
  'rmsea.ci.lower'?: number
  'rmsea.ci.upper'?: number
  srmr: number
}

export interface PathResult {
  from: string
  to: string
  beta: number
  se: number
  pValue: number
  ci: [number, number]
}

// ── 기준값 판단 헬퍼 ──

export function getAlphaGrade(alpha: number): '우수' | '양호' | '수용' | '미흡' {
  if (alpha >= 0.9) return '우수'
  if (alpha >= 0.8) return '양호'
  if (alpha >= 0.7) return '수용'
  return '미흡'
}

export function getFitGrade(cfi: number, rmsea: number): '우수' | '양호' | '수용' | '미흡' {
  if (cfi >= 0.95 && rmsea <= 0.05) return '우수'
  if (cfi >= 0.95 && rmsea <= 0.08) return '양호'
  if (cfi >= 0.90 && rmsea <= 0.08) return '수용'
  return '미흡'
}

function formatP(p: number): string {
  if (p < 0.001) return 'p<.001'
  if (p < 0.01) return `p=.${(p * 1000).toFixed(0).padStart(3, '0')}`
  if (p < 0.05) return `p=.${(p * 100).toFixed(0).padStart(2, '0')}`
  return `p=.${(p * 100).toFixed(0).padStart(2, '0')}`
}

function formatNum(n: number): string {
  return n.toFixed(3).replace(/^0\./, '.')
}

// ── 신뢰도 해석 ──

export function interpretReliability(alpha: number, variableName: string): string {
  const grade = getAlphaGrade(alpha)
  const gradeText = grade === '미흡'
    ? '기준값(.70)에 미치지 못하는 수준이었다'
    : `${grade === '우수' ? '매우 높은' : grade === '양호' ? '양호한' : '수용 가능한'} 신뢰도를 나타냈다(α>.70)`

  return `${variableName} 척도의 Cronbach's α는 ${formatNum(alpha)}로 ${gradeText}.`
}

// ── CFA 모형적합도 해석 ──

export function interpretCFAFit(fit: FitMeasures): string {
  const grade = getFitGrade(fit.cfi, fit.rmsea)
  const gradeText = grade === '우수' || grade === '양호'
    ? '양호한 수준이었다'
    : grade === '수용' ? '수용 가능한 수준이었다' : '적합도 기준을 충족하지 못하였다'

  let text = `측정모형의 적합도는 CFI=${formatNum(fit.cfi)}, TLI=${formatNum(fit.tli)}, RMSEA=${formatNum(fit.rmsea)}`

  if (fit['rmsea.ci.lower'] !== undefined && fit['rmsea.ci.upper'] !== undefined) {
    text += `(90% CI [${formatNum(fit['rmsea.ci.lower'])}, ${formatNum(fit['rmsea.ci.upper'])}])`
  }

  text += `, SRMR=${formatNum(fit.srmr)}로 ${gradeText}.`

  return text
}

// ── AVE/CR 수렴타당도 해석 ──

export function interpretConvergentValidity(
  variableName: string,
  ave: number,
  cr: number
): string {
  const aveMet = ave >= 0.5
  const crMet = cr >= 0.7

  if (aveMet && crMet) {
    return `${variableName}의 평균분산추출(AVE=${formatNum(ave)})과 개념신뢰도(CR=${formatNum(cr)})가 기준값(AVE>.50, CR>.70)을 충족하여 수렴타당도가 확인되었다.`
  }

  const issues: string[] = []
  if (!aveMet) issues.push(`AVE(${formatNum(ave)})가 기준값(.50)에 미달`)
  if (!crMet) issues.push(`CR(${formatNum(cr)})이 기준값(.70)에 미달`)

  return `${variableName}의 ${issues.join('하고, ')}하여 수렴타당도에 대한 추가 검토가 필요하다.`
}

// ── HTMT 판별타당도 해석 ──

export function interpretDiscriminantValidity(
  htmtMatrix: Record<string, number>
): string {
  const entries = Object.entries(htmtMatrix)

  if (entries.length === 0) return '판별타당도 분석 결과가 없습니다.'

  const allMet = entries.every(([, value]) => value < 0.85)

  if (allMet) {
    const maxEntry = entries.reduce((a, b) => a[1] > b[1] ? a : b)
    return `모든 잠재변수 쌍의 HTMT 값이 기준값(.85) 미만으로 판별타당도가 확인되었다(최대 HTMT=${formatNum(maxEntry[1])}, ${maxEntry[0]}).`
  }

  const failed = entries.filter(([, value]) => value >= 0.85)
  const failedText = failed.map(([pair, value]) => `${pair}(HTMT=${formatNum(value)})`).join(', ')

  return `일부 잠재변수 쌍의 HTMT 값이 기준값(.85)을 초과하여 판별타당도에 문제가 있을 수 있다: ${failedText}.`
}

// ── SEM 경로계수 해석 ──

export function interpretPathCoefficient(
  from: string,
  to: string,
  beta: number,
  se: number,
  pValue: number,
  ci: [number, number]
): string {
  const significant = pValue < 0.05
  const direction = beta > 0 ? '정(+)적' : '부(-)적'

  if (significant) {
    return `${from}이(가) ${to}에 미치는 영향은 β=${formatNum(beta)}(SE=${formatNum(se)}, ${formatP(pValue)}, 95% CI [${formatNum(ci[0])}, ${formatNum(ci[1])}])로 통계적으로 유의한 ${direction} 영향을 미치는 것으로 나타났다.`
  }

  return `${from}이(가) ${to}에 미치는 영향은 β=${formatNum(beta)}(SE=${formatNum(se)}, ${formatP(pValue)}, 95% CI [${formatNum(ci[0])}, ${formatNum(ci[1])}])로 통계적으로 유의하지 않았다.`
}

// ── SEM 전체 모형 해석 ──

export function interpretSEMModel(
  fitMeasures: FitMeasures,
  paths: PathResult[],
  rSquared: Record<string, number>
): string {
  const parts: string[] = []

  // 적합도
  const fitGrade = getFitGrade(fitMeasures.cfi, fitMeasures.rmsea)
  parts.push(
    `구조모형의 적합도는 CFI=${formatNum(fitMeasures.cfi)}, TLI=${formatNum(fitMeasures.tli)}, RMSEA=${formatNum(fitMeasures.rmsea)}, SRMR=${formatNum(fitMeasures.srmr)}로 ${fitGrade === '미흡' ? '적합도 기준을 충족하지 못하였다' : '양호한 수준이었다'}.`
  )

  // 경로계수
  paths.forEach((path) => {
    parts.push(
      interpretPathCoefficient(path.from, path.to, path.beta, path.se, path.pValue, path.ci)
    )
  })

  // R²
  const rSquaredEntries = Object.entries(rSquared)
  if (rSquaredEntries.length > 0) {
    const rText = rSquaredEntries
      .map(([name, r2]) => `${name}(R²=${formatNum(r2)})`)
      .join(', ')
    parts.push(`종속변수의 설명 분산은 ${rText}이었다.`)
  }

  return parts.join(' ')
}

// ── 매개효과 해석 ──

export function interpretMediation(
  mediator: string,
  indirectEffect: number,
  ci: [number, number],
  isSignificant: boolean
): string {
  const ciIncludesZero = ci[0] <= 0 && ci[1] >= 0

  if (isSignificant && !ciIncludesZero) {
    return `${mediator}을(를) 통한 간접효과는 β=${formatNum(indirectEffect)}(95% CI [${formatNum(ci[0])}, ${formatNum(ci[1])}])로 부트스트랩 신뢰구간에 0이 포함되지 않아 통계적으로 유의하였다. 이에 따라 ${mediator}의 매개효과가 확인되었다.`
  }

  return `${mediator}을(를) 통한 간접효과는 β=${formatNum(indirectEffect)}(95% CI [${formatNum(ci[0])}, ${formatNum(ci[1])}])로 부트스트랩 신뢰구간에 0이 포함되어 통계적으로 유의하지 않았다.`
}

// ── 전체 분석 결과 통합 해석 ──

export function generateFullInterpretation(params: {
  reliabilities: { variableName: string; alpha: number }[]
  fitMeasures: FitMeasures
  aveCrList: { variableName: string; ave: number; cr: number }[]
  paths: PathResult[]
  rSquared: Record<string, number>
  mediations?: { mediator: string; indirect: number; ci: [number, number]; significant: boolean }[]
}): string {
  const sections: string[] = []

  // 1. 신뢰도
  sections.push('1. 신뢰도 분석')
  params.reliabilities.forEach((r) => {
    sections.push(interpretReliability(r.alpha, r.variableName))
  })

  // 2. 측정모형
  sections.push('\n2. 측정모형 분석')
  sections.push(interpretCFAFit(params.fitMeasures))
  params.aveCrList.forEach((item) => {
    sections.push(interpretConvergentValidity(item.variableName, item.ave, item.cr))
  })

  // 3. 구조모형
  if (params.paths.length > 0) {
    sections.push('\n3. 구조모형 분석')
    sections.push(
      interpretSEMModel(params.fitMeasures, params.paths, params.rSquared)
    )
  }

  // 4. 매개효과
  if (params.mediations && params.mediations.length > 0) {
    sections.push('\n4. 매개효과 분석')
    params.mediations.forEach((m) => {
      sections.push(interpretMediation(m.mediator, m.indirect, m.ci, m.significant))
    })
  }

  return sections.join('\n')
}
