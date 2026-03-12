import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  try {
    const body = await req.json()
    const { formId, groupId, answers } = body

    if (!formId || !answers) {
      return NextResponse.json(
        { success: false, error: '설문 ID와 응답 데이터가 필요합니다.' },
        { status: 400 }
      )
    }

    // 설문 상태 확인
    const { data: form } = await supabase
      .from('survey_forms')
      .select('status')
      .eq('id', formId)
      .single()

    if (!form || form.status !== 'active') {
      return NextResponse.json(
        { success: false, error: '설문이 활성 상태가 아닙니다.' },
        { status: 400 }
      )
    }

    // group_id 조회 (토큰 기반)
    let resolvedGroupId: string | null = null
    if (groupId) {
      const { data: group } = await supabase
        .from('survey_groups')
        .select('id')
        .eq('token', groupId)
        .eq('form_id', formId)
        .single()

      resolvedGroupId = group?.id ?? null
    }

    // 응답자 토큰 생성 (중복 방지)
    const respondentToken = crypto.randomUUID()

    // IP 해시 (개인정보보호)
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0] ?? 'unknown'
    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(ip))
    const ipHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 16)

    // 응답 레코드 생성
    const { data: response, error: responseError } = await supabase
      .from('survey_responses')
      .insert({
        form_id: formId,
        group_id: resolvedGroupId,
        respondent_token: respondentToken,
        is_complete: true,
        completed_at: new Date().toISOString(),
        ip_hash: ipHash,
      })
      .select()
      .single()

    if (responseError) {
      return NextResponse.json(
        { success: false, error: `응답 저장 실패: ${responseError.message}` },
        { status: 500 }
      )
    }

    // 문항별 응답 저장
    const answerEntries = Object.entries(answers as Record<string, string | number>)
    if (answerEntries.length > 0) {
      // 문항 목록 조회
      const { data: questions } = await supabase
        .from('survey_questions')
        .select('id, order_index')
        .eq('form_id', formId)
        .order('order_index')

      const questionMap = new Map(
        (questions ?? []).map((q: { id: string; order_index: number }) => [String(q.order_index + 1), q.id])
      )

      const items = answerEntries
        .map(([key, value]) => {
          // key가 question ID이거나 문항 번호일 수 있음
          const questionId = questionMap.get(key) ?? key
          return {
            response_id: response.id,
            question_id: questionId,
            value_numeric: typeof value === 'number' ? value : null,
            value_text: typeof value === 'string' ? value : null,
          }
        })
        .filter((item) => item.question_id)

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('survey_response_items')
          .insert(items)

        if (itemsError) {
          console.error('응답 아이템 저장 실패:', itemsError.message)
        }
      }
    }

    return NextResponse.json({
      success: true,
      responseId: response.id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '설문 제출 중 오류가 발생했습니다.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
