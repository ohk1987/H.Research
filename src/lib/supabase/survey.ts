import { createClient } from './client'
import type { SurveyForm, SurveyGroup, SurveyQuestion, SurveyStats } from '@/types/survey'
import { generateGroupToken } from '@/lib/utils/token'

type SurveyFormInput = Omit<SurveyForm, 'id' | 'createdAt' | 'updatedAt'>

// ─── 설문 폼 CRUD ───

export async function createSurveyForm(
  projectId: string,
  data: Partial<SurveyFormInput>
): Promise<SurveyForm> {
  const supabase = createClient()
  const { data: form, error } = await supabase
    .from('survey_forms')
    .insert({
      project_id: projectId,
      title: data.title ?? '새 설문',
      description: data.description,
      status: data.status ?? 'draft',
      target_responses: data.targetResponses,
      start_date: data.startDate,
      end_date: data.endDate,
      settings: data.settings ?? {},
    })
    .select()
    .single()

  if (error) throw new Error(`설문 생성 실패: ${error.message}`)
  return mapFormRow(form)
}

export async function getSurveyForm(formId: string): Promise<SurveyForm | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('survey_forms')
    .select()
    .eq('id', formId)
    .single()

  if (error) return null
  return mapFormRow(data)
}

export async function updateSurveyForm(
  formId: string,
  data: Partial<SurveyFormInput>
): Promise<SurveyForm> {
  const supabase = createClient()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (data.title !== undefined) updates.title = data.title
  if (data.description !== undefined) updates.description = data.description
  if (data.status !== undefined) updates.status = data.status
  if (data.targetResponses !== undefined) updates.target_responses = data.targetResponses
  if (data.startDate !== undefined) updates.start_date = data.startDate
  if (data.endDate !== undefined) updates.end_date = data.endDate
  if (data.settings !== undefined) updates.settings = data.settings

  const { data: form, error } = await supabase
    .from('survey_forms')
    .update(updates)
    .eq('id', formId)
    .select()
    .single()

  if (error) throw new Error(`설문 수정 실패: ${error.message}`)
  return mapFormRow(form)
}

// ─── 설문 문항 ───

export async function getSurveyQuestions(formId: string): Promise<SurveyQuestion[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('survey_questions')
    .select()
    .eq('form_id', formId)
    .order('order_index')

  if (error) throw new Error(`문항 조회 실패: ${error.message}`)
  return (data ?? []).map(mapQuestionRow)
}

export async function saveSurveyQuestions(
  formId: string,
  questions: Omit<SurveyQuestion, 'id'>[]
): Promise<SurveyQuestion[]> {
  const supabase = createClient()

  // 기존 문항 삭제 후 재삽입
  await supabase.from('survey_questions').delete().eq('form_id', formId)

  const rows = questions.map((q) => ({
    form_id: formId,
    latent_variable_id: q.latentVariableId ?? null,
    question_text: q.questionText,
    question_type: q.questionType,
    scale_min: q.scaleMin,
    scale_max: q.scaleMax,
    is_reversed: q.isReversed,
    order_index: q.orderIndex,
    page_number: q.pageNumber,
    is_required: q.isRequired,
  }))

  const { data, error } = await supabase
    .from('survey_questions')
    .insert(rows)
    .select()

  if (error) throw new Error(`문항 저장 실패: ${error.message}`)
  return (data ?? []).map(mapQuestionRow)
}

// ─── 설문 그룹 ───

export async function createSurveyGroup(
  formId: string,
  name: string,
  description?: string
): Promise<SurveyGroup> {
  const supabase = createClient()
  const token = generateGroupToken()

  const { data, error } = await supabase
    .from('survey_groups')
    .insert({
      form_id: formId,
      name,
      token,
      description: description ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(`그룹 생성 실패: ${error.message}`)
  return mapGroupRow(data)
}

export async function getSurveyGroups(formId: string): Promise<SurveyGroup[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('survey_groups')
    .select()
    .eq('form_id', formId)
    .order('created_at')

  if (error) throw new Error(`그룹 조회 실패: ${error.message}`)
  return (data ?? []).map(mapGroupRow)
}

export async function deleteSurveyGroup(groupId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('survey_groups')
    .delete()
    .eq('id', groupId)

  if (error) throw new Error(`그룹 삭제 실패: ${error.message}`)
}

// ─── 응답 통계 ───

export async function getSurveyStats(formId: string): Promise<SurveyStats> {
  const supabase = createClient()

  const { data: responses, error } = await supabase
    .from('survey_responses')
    .select('id, group_id, is_complete, completed_at')
    .eq('form_id', formId)

  if (error) throw new Error(`통계 조회 실패: ${error.message}`)

  const all = responses ?? []
  const completed = all.filter((r) => r.is_complete)
  const inProgress = all.filter((r) => !r.is_complete && !r.completed_at)
  const abandoned = all.filter((r) => !r.is_complete && r.completed_at)

  // 그룹별 통계
  const { data: groups } = await supabase
    .from('survey_groups')
    .select('id, name')
    .eq('form_id', formId)

  const groupStats = groups?.map((g) => {
    const groupResponses = all.filter((r) => r.group_id === g.id)
    const groupCompleted = groupResponses.filter((r) => r.is_complete)
    return {
      groupId: g.id,
      groupName: g.name,
      completed: groupCompleted.length,
      inProgress: groupResponses.filter((r) => !r.is_complete).length,
      total: groupResponses.length,
      completionRate: groupResponses.length > 0
        ? Math.round((groupCompleted.length / groupResponses.length) * 100)
        : 0,
    }
  })

  return {
    total: all.length,
    completed: completed.length,
    inProgress: inProgress.length,
    abandoned: abandoned.length,
    completionRate: all.length > 0
      ? Math.round((completed.length / all.length) * 100)
      : 0,
    groupStats: groupStats && groupStats.length > 0 ? groupStats : undefined,
  }
}

// ─── 응답 데이터 조회 ───

export async function getSurveyResponseData(formId: string) {
  const supabase = createClient()

  const { data: responses, error: rErr } = await supabase
    .from('survey_responses')
    .select(`
      id,
      group_id,
      is_complete,
      started_at,
      completed_at,
      survey_response_items (
        question_id,
        value_numeric,
        value_text
      )
    `)
    .eq('form_id', formId)
    .eq('is_complete', true)

  if (rErr) throw new Error(`응답 데이터 조회 실패: ${rErr.message}`)
  return responses ?? []
}

// ─── 설문 → 데이터셋 변환 ───

export async function convertResponsesToDataset(formId: string, projectId: string) {
  const supabase = createClient()

  // 문항 조회
  const questions = await getSurveyQuestions(formId)

  // 완료된 응답 조회
  const responseData = await getSurveyResponseData(formId)

  // 그룹 정보 조회
  const groups = await getSurveyGroups(formId)
  const groupMap = new Map(groups.map((g) => [g.id, g.name]))

  const hasGroups = responseData.some((r) => r.group_id !== null)

  // 헤더 생성
  const questionHeaders = questions.map((q) => `q${q.orderIndex + 1}`)
  const headers = hasGroups ? ['group_id', ...questionHeaders] : questionHeaders

  // 행 데이터 생성
  const rows = responseData.map((response) => {
    const itemMap = new Map(
      (response.survey_response_items as { question_id: string; value_numeric: number | null; value_text: string | null }[])
        .map((item) => [item.question_id, item])
    )

    const values: (string | number | null)[] = []

    if (hasGroups) {
      values.push(response.group_id ? (groupMap.get(response.group_id) ?? 'ungrouped') : 'ungrouped')
    }

    questions.forEach((q) => {
      const item = itemMap.get(q.id)
      if (!item) {
        values.push(null)
        return
      }

      let value: number | string | null = item.value_numeric ?? item.value_text ?? null

      // 역문항 처리
      if (q.isReversed && typeof value === 'number') {
        value = q.scaleMax + q.scaleMin - value
      }

      values.push(value)
    })

    return values
  })

  // datasets 테이블에 저장
  const { data: dataset, error } = await supabase
    .from('datasets')
    .insert({
      project_id: projectId,
      name: `설문 응답 데이터 (${new Date().toLocaleDateString('ko-KR')})`,
      row_count: rows.length,
      column_count: headers.length,
      headers,
      source: 'survey',
    })
    .select()
    .single()

  if (error) throw new Error(`데이터셋 저장 실패: ${error.message}`)

  return {
    datasetId: dataset.id,
    headers,
    rows,
    rowCount: rows.length,
    hasGroups,
  }
}

// ─── Row 매핑 헬퍼 ───

function mapFormRow(row: Record<string, unknown>): SurveyForm {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    title: row.title as string,
    description: row.description as string | undefined,
    status: row.status as SurveyForm['status'],
    targetResponses: row.target_responses as number | undefined,
    startDate: row.start_date as string | undefined,
    endDate: row.end_date as string | undefined,
    settings: (row.settings as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapQuestionRow(row: Record<string, unknown>): SurveyQuestion {
  return {
    id: row.id as string,
    formId: row.form_id as string,
    latentVariableId: row.latent_variable_id as string | undefined,
    questionText: row.question_text as string,
    questionType: row.question_type as SurveyQuestion['questionType'],
    scaleMin: row.scale_min as number,
    scaleMax: row.scale_max as number,
    isReversed: row.is_reversed as boolean,
    orderIndex: row.order_index as number,
    pageNumber: row.page_number as number,
    isRequired: row.is_required as boolean,
  }
}

function mapGroupRow(row: Record<string, unknown>): SurveyGroup {
  return {
    id: row.id as string,
    formId: row.form_id as string,
    name: row.name as string,
    token: row.token as string,
    description: row.description as string | undefined,
    createdAt: row.created_at as string,
  }
}
