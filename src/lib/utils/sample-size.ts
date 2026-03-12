// 표본 크기 계산 유틸리티

// SEM 표본 크기
export function calculateSEMSampleSize(
  nLatentVars: number,
  nItems: number
): { minimum: number; recommended: number } {
  return {
    minimum: Math.max(200, nItems * 10),
    recommended: Math.max(300, nItems * 15),
  }
}

// 회귀분석 표본 크기 (Cohen, 1992 기반)
export function calculateRegressionSampleSize(
  nPredictors: number,
  effectSize: 'small' | 'medium' | 'large',
  power: number
): number {
  const f2Map = { small: 0.02, medium: 0.15, large: 0.35 }
  const f2 = f2Map[effectSize]

  // 근사 공식: n = (L / f2) + k + 1
  // L값은 검정력 테이블에서 가져옴 (근사)
  const lambdaMap: Record<string, Record<number, number>> = {
    small: { 0.7: 7.85, 0.8: 9.94, 0.9: 13.36, 0.95: 16.51 },
    medium: { 0.7: 7.85, 0.8: 9.94, 0.9: 13.36, 0.95: 16.51 },
    large: { 0.7: 7.85, 0.8: 9.94, 0.9: 13.36, 0.95: 16.51 },
  }

  const lambda = lambdaMap[effectSize][power] ?? 9.94
  return Math.ceil(lambda / f2 + nPredictors + 1)
}

// 독립표본 t-test 표본 크기 (집단당)
export function calculateTTestSampleSize(
  effectSize: 'small' | 'medium' | 'large',
  power: number
): number {
  // Cohen's d 기반 표본 크기 표
  const table: Record<string, Record<number, number>> = {
    small: { 0.7: 322, 0.8: 393, 0.9: 526, 0.95: 651 },
    medium: { 0.7: 51, 0.8: 64, 0.9: 85, 0.95: 105 },
    large: { 0.7: 21, 0.8: 26, 0.9: 35, 0.95: 43 },
  }
  return table[effectSize][power] ?? table[effectSize][0.8]
}

// ANOVA 표본 크기 (전체)
export function calculateANOVASampleSize(
  nGroups: number,
  effectSize: 'small' | 'medium' | 'large',
  power: number
): number {
  // 집단당 n * 집단 수
  const perGroup: Record<string, Record<number, number>> = {
    small: { 0.7: 215, 0.8: 274, 0.9: 363, 0.95: 453 },
    medium: { 0.7: 36, 0.8: 45, 0.9: 60, 0.95: 76 },
    large: { 0.7: 15, 0.8: 19, 0.9: 25, 0.95: 31 },
  }
  const n = perGroup[effectSize][power] ?? perGroup[effectSize][0.8]
  return n * nGroups
}

// 상관분석 표본 크기
export function calculateCorrelationSampleSize(
  expectedR: number,
  power: number
): number {
  // Fisher z 변환 기반 근사
  const z = 0.5 * Math.log((1 + Math.abs(expectedR)) / (1 - Math.abs(expectedR)))
  const zAlpha = 1.96  // α = .05
  const zBetaMap: Record<number, number> = { 0.7: 0.524, 0.8: 0.842, 0.9: 1.282, 0.95: 1.645 }
  const zBeta = zBetaMap[power] ?? 0.842

  const n = Math.ceil(((zAlpha + zBeta) / z) ** 2 + 3)
  return Math.max(n, 20)
}
