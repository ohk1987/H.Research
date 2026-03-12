import { callREngine } from './client'

// ─── 타입 정의 ───

export interface DescriptiveResult {
  success: boolean
  results: {
    variable: string
    n: number
    mean: number
    sd: number
    min: number
    max: number
    skewness: number
    kurtosis: number
  }[]
}

export interface ReliabilityResult {
  success: boolean
  alpha: number
  std_alpha: number
  item_stats: Record<string, unknown>
}

export interface EFAResult {
  success: boolean
  loadings: number[][]
  communalities: Record<string, number>
  fit: { rmsea: number; tli: number }
}

export interface CFAResult {
  success: boolean
  fit_measures: {
    cfi: number
    tli: number
    rmsea: number
    'rmsea.ci.lower': number
    'rmsea.ci.upper': number
    srmr: number
    aic: number
    bic: number
  }
  parameters: CFAParameter[]
  ave: number
  cr: number
  ave_cr?: { variable: string; ave: number; cr: number }[]
}

export interface CFAParameter {
  lhs: string
  op: string
  rhs: string
  est: number
  se: number
  z: number
  pvalue: number
  'std.all': number
  ci_lower?: number
  ci_upper?: number
}

export interface SEMOptions {
  estimator?: 'ML' | 'MLR' | 'WLSMV'
  bootstrap?: number
  missing?: 'fiml' | 'listwise'
  ci?: number
}

export interface SEMResult {
  success: boolean
  fit_measures: {
    cfi: number
    tli: number
    rmsea: number
    'rmsea.ci.lower': number
    'rmsea.ci.upper': number
    srmr: number
  }
  parameters: CFAParameter[]
}

export interface MediationModel {
  iv: string
  mediator: string
  dv: string
  model: string
}

export interface MediationResult {
  success: boolean
  indirect_effects: CFAParameter[]
  parameters: CFAParameter[]
}

// ─── 분석 함수 ───

// 기술통계
export async function runDescriptive(
  data: Record<string, number[]>
): Promise<DescriptiveResult> {
  return callREngine<DescriptiveResult>('/analyze/descriptive', { data })
}

// 신뢰도 분석 (Cronbach's α)
export async function runReliability(
  data: Record<string, number[]>
): Promise<ReliabilityResult> {
  return callREngine<ReliabilityResult>('/analyze/reliability', { data })
}

// EFA (탐색적 요인분석)
export async function runEFA(
  data: Record<string, number[]>,
  nFactors?: number
): Promise<EFAResult> {
  return callREngine<EFAResult>('/analyze/efa', { data, nFactors })
}

// CFA (확인적 요인분석)
export async function runCFA(
  data: Record<string, number[]>,
  model: string
): Promise<CFAResult> {
  return callREngine<CFAResult>('/analyze/cfa', { data, model })
}

// 구조방정식 (SEM)
export async function runSEM(
  data: Record<string, number[]>,
  model: string,
  options: SEMOptions = {}
): Promise<SEMResult> {
  return callREngine<SEMResult>('/analyze/sem', {
    data,
    model,
    bootstrap: options.bootstrap ?? 5000,
    estimator: options.estimator ?? 'ML',
    missing: options.missing ?? 'fiml',
  })
}

// 매개분석
export async function runMediation(
  data: Record<string, number[]>,
  model: MediationModel,
  bootstrap = 5000
): Promise<MediationResult> {
  return callREngine<MediationResult>('/analyze/mediation', {
    data,
    model: model.model,
    bootstrap,
  })
}
