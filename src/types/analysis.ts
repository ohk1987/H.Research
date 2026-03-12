export interface AnalysisOptions {
  estimator: 'ML' | 'WLSMV' | 'MLR'
  bootstrap: 1000 | 5000 | 10000
  confidenceInterval: 90 | 95 | 99
  missingData: 'fiml' | 'listwise'
  rotation: 'varimax' | 'oblimin' | 'promax'
}

export const DEFAULT_OPTIONS: AnalysisOptions = {
  estimator: 'ML',
  bootstrap: 5000,
  confidenceInterval: 95,
  missingData: 'fiml',
  rotation: 'varimax',
}

export interface TTestResult {
  success: boolean
  t: number
  df: number
  p: number
  ci: [number, number]
  cohen_d: number
  means: Record<string, number>
}

export interface ANOVAResult {
  success: boolean
  f: number
  df1: number
  df2: number
  p: number
  eta_squared: number
  post_hoc: Record<string, unknown> | null
}

export interface CorrelationResult {
  success: boolean
  correlation: Record<string, Record<string, number>>
  p_values: Record<string, Record<string, number>>
  n: number
}

export interface CrosstabResult {
  success: boolean
  chi_squared: number
  df: number
  p: number
  cramers_v: number
  observed: Record<string, Record<string, number>>
  expected: Record<string, Record<string, number>>
}

export interface CMVResult {
  success: boolean
  harman: {
    first_factor_variance: number
    is_problematic: boolean
    interpretation: string
  }
}

export interface MGAResult {
  success: boolean
  configural: Record<string, number>
  metric: Record<string, number>
  scalar: Record<string, number>
  delta_cfi_metric: number
  delta_cfi_scalar: number
}

export interface ProcessResult {
  success: boolean
  parameters: {
    lhs: string; op: string; rhs: string
    est: number; se: number; pvalue: number; 'std.all': number
  }[]
  indirect_effects: {
    lhs: string; op: string; rhs: string
    est: number; se: number; pvalue: number; 'std.all': number
    ci_lower?: number; ci_upper?: number
  }[]
}
