import { callREngine } from './client'
import type {
  TTestResult,
  ANOVAResult,
  CorrelationResult,
  CrosstabResult,
  CMVResult,
  MGAResult,
  ProcessResult,
  HLMPrereqResult,
  HLMResult,
} from '@/types/analysis'

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

// ─── Phase 2-1: 기본 분석 ───

// 독립표본 t-test
export async function runTTest(
  data: Record<string, number[]>,
  dv: string,
  group: string,
  ci = 0.95
): Promise<TTestResult> {
  return callREngine<TTestResult>('/analyze/ttest', { data, dv, group, ci })
}

// 일원분산분석 (ANOVA)
export async function runANOVA(
  data: Record<string, number[]>,
  dv: string,
  group: string
): Promise<ANOVAResult> {
  return callREngine<ANOVAResult>('/analyze/anova', { data, dv, group })
}

// 상관분석
export async function runCorrelation(
  data: Record<string, number[]>,
  method: 'pearson' | 'spearman' | 'kendall' = 'pearson'
): Promise<CorrelationResult> {
  return callREngine<CorrelationResult>('/analyze/correlation', { data, method })
}

// 교차분석
export async function runCrosstab(
  data: Record<string, (string | number)[]>,
  var1: string,
  var2: string
): Promise<CrosstabResult> {
  return callREngine<CrosstabResult>('/analyze/crosstab', { data, var1, var2 })
}

// PROCESS 모형 (조건부 간접효과)
export async function runProcess(
  data: Record<string, number[]>,
  model: string,
  bootstrap = 5000,
  estimator: 'ML' | 'MLR' = 'ML'
): Promise<ProcessResult> {
  return callREngine<ProcessResult>('/analyze/process', {
    data, model, bootstrap, estimator,
  }, 120000)
}

// PLS-SEM
export interface PLSSEMResult {
  success: boolean
  path_coefficients: Record<string, number>
  r_squared: Record<string, number>
  reliability: {
    alpha: Record<string, number>
    rho_c: Record<string, number>
    ave: Record<string, number>
  }
  bootstrap: {
    paths: Record<string, number[]>
  }
  error?: string
}

export async function runPLSSEM(
  data: Record<string, number[]>,
  measurement: string,
  structural: string
): Promise<PLSSEMResult> {
  return callREngine<PLSSEMResult>('/analyze/plssem', {
    data, measurement, structural,
  }, 120000)
}

// 다중집단분석 (MGA)
export async function runMGA(
  data: Record<string, number[]>,
  model: string,
  group: string,
  estimator: 'ML' | 'MLR' | 'WLSMV' = 'ML'
): Promise<MGAResult> {
  return callREngine<MGAResult>('/analyze/mga', {
    data, model, group, estimator,
  }, 120000)
}

// 동일방법편의 (CMV)
export async function runCMV(
  data: Record<string, number[]>
): Promise<CMVResult> {
  return callREngine<CMVResult>('/analyze/cmv', { data })
}

// ─── Phase 3-1: HLM 다층분석 ───

// HLM 사전 검증 (ICC·rwg)
export async function runHLMPrerequisites(
  data: Record<string, number[]>,
  groupVar: string,
  targetVars: string[]
): Promise<HLMPrereqResult> {
  return callREngine<HLMPrereqResult>('/analyze/hlm/prerequisites', {
    data, groupVar, targetVars,
  }, 120000)
}

// HLM 다층모형
export async function runHLM(
  data: Record<string, number[]>,
  outcome: string,
  groupVar: string,
  modelType: 'null' | 'random_intercept' | 'random_slope' | 'cross_level',
  level1Preds?: string[],
  level2Preds?: string[]
): Promise<HLMResult> {
  return callREngine<HLMResult>('/analyze/hlm', {
    data, outcome, groupVar, modelType,
    level1Preds: level1Preds ?? [],
    level2Preds: level2Preds ?? [],
  }, 120000)
}
