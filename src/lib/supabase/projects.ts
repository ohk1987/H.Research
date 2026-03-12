import { createClient } from './client'
import type { Project, Dataset } from '@/types/database'
import type { LatentVariable } from '@/types/variables'

// 프로젝트 생성
export async function createProject(name: string): Promise<Project> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('로그인이 필요합니다.')

  const { data, error } = await supabase
    .from('projects')
    .insert({ title: name, user_id: user.id, status: 'active' })
    .select()
    .single()

  if (error) throw new Error(`프로젝트 생성 실패: ${error.message}`)
  return data
}

// 프로젝트 조회
export async function getProject(id: string): Promise<Project> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select()
    .eq('id', id)
    .single()

  if (error) throw new Error(`프로젝트 조회 실패: ${error.message}`)
  return data
}

// 데이터셋 메타정보 저장
export async function saveDataset(
  projectId: string,
  fileInfo: { fileName: string; filePath: string; rowCount: number; columnCount: number }
): Promise<Dataset> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('datasets')
    .insert({
      project_id: projectId,
      file_name: fileInfo.fileName,
      file_path: fileInfo.filePath,
      row_count: fileInfo.rowCount,
      column_count: fileInfo.columnCount,
    })
    .select()
    .single()

  if (error) throw new Error(`데이터셋 저장 실패: ${error.message}`)
  return data
}

// 파일을 Supabase Storage에 업로드
export async function uploadFileToStorage(
  projectId: string,
  file: File
): Promise<string> {
  const supabase = createClient()
  const filePath = `${projectId}/${Date.now()}_${file.name}`

  const { error } = await supabase.storage
    .from('datasets')
    .upload(filePath, file)

  if (error) throw new Error(`파일 업로드 실패: ${error.message}`)
  return filePath
}

// 잠재변수 저장
export async function saveLatentVariables(
  projectId: string,
  datasetId: string,
  variables: LatentVariable[]
): Promise<void> {
  const supabase = createClient()

  // 기존 잠재변수 삭제 후 새로 저장
  await supabase
    .from('latent_variables')
    .delete()
    .eq('project_id', projectId)

  if (variables.length === 0) return

  const rows = variables.map((v, index) => ({
    project_id: projectId,
    dataset_id: datasetId,
    name: v.name,
    color: v.color,
    order_index: index,
  }))

  const { error } = await supabase.from('latent_variables').insert(rows)

  if (error) throw new Error(`잠재변수 저장 실패: ${error.message}`)
}
