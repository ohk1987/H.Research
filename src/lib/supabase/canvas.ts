import { createClient } from './client'
import type { CanvasVersion } from '@/types/database'
import type { Json } from '@/types/database'

// 캔버스 버전 저장
export async function saveCanvasVersion(
  modelId: string,
  versionData: { nodes: Json; edges: Json },
  note: string
): Promise<void> {
  const supabase = createClient()

  // 현재 최대 버전 번호 조회
  const { data: existing } = await supabase
    .from('canvas_versions')
    .select('version_number')
    .eq('canvas_model_id', modelId)
    .order('version_number', { ascending: false })
    .limit(1)

  const nextVersion = existing && existing.length > 0 ? existing[0].version_number + 1 : 1

  const { error } = await supabase.from('canvas_versions').insert({
    canvas_model_id: modelId,
    version_number: nextVersion,
    canvas_data: { nodes: versionData.nodes, edges: versionData.edges },
    note,
  })

  if (error) throw new Error(`버전 저장 실패: ${error.message}`)

  // canvas_models 테이블도 업데이트
  await supabase
    .from('canvas_models')
    .update({
      version: nextVersion,
      canvas_data: { nodes: versionData.nodes, edges: versionData.edges },
      updated_at: new Date().toISOString(),
    })
    .eq('id', modelId)
}

// 캔버스 버전 목록 조회
export async function getCanvasVersions(modelId: string): Promise<CanvasVersion[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('canvas_versions')
    .select()
    .eq('canvas_model_id', modelId)
    .order('version_number', { ascending: false })

  if (error) throw new Error(`버전 목록 조회 실패: ${error.message}`)
  return data
}

// 특정 버전 로드
export async function loadCanvasVersion(versionId: string): Promise<CanvasVersion> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('canvas_versions')
    .select()
    .eq('id', versionId)
    .single()

  if (error) throw new Error(`버전 로드 실패: ${error.message}`)
  return data
}
