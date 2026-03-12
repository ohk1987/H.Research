import { createClient } from './client'
import type { AnalysisResult } from '@/types/database'
import type { Json } from '@/types/database'

// 분석 실행 기록 생성
export async function saveAnalysisRun(
  canvasModelId: string,
  options: Record<string, unknown>
): Promise<string> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('analysis_runs')
    .insert({
      canvas_model_id: canvasModelId,
      status: 'running',
      options: options as Json,
    })
    .select('id')
    .single()

  if (error) throw new Error(`분석 실행 기록 생성 실패: ${error.message}`)
  return data.id
}

// 분석 상태 업데이트
export async function updateAnalysisRunStatus(
  runId: string,
  status: 'completed' | 'failed'
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('analysis_runs')
    .update({ status })
    .eq('id', runId)

  if (error) throw new Error(`분석 상태 업데이트 실패: ${error.message}`)
}

// 분석 결과 저장
export async function saveAnalysisResult(
  runId: string,
  resultData: Record<string, unknown>,
  interpretationKo?: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('analysis_results').insert({
    analysis_run_id: runId,
    result_data: resultData as Json,
    interpretation_ko: interpretationKo ?? null,
  })

  if (error) throw new Error(`분석 결과 저장 실패: ${error.message}`)
}

// 최신 분석 결과 조회
export async function getLatestAnalysisResult(
  canvasModelId: string
): Promise<AnalysisResult | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('analysis_results')
    .select(`
      *,
      analysis_runs!inner(canvas_model_id, status)
    `)
    .eq('analysis_runs.canvas_model_id', canvasModelId)
    .eq('analysis_runs.status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // 결과 없음
    throw new Error(`분석 결과 조회 실패: ${error.message}`)
  }
  return data
}
