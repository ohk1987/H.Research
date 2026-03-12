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
    const { reviewRequestId, approvedBy, canvasVersionId, note } = body

    if (!reviewRequestId || !approvedBy) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 승인 기록 생성
    const { error: approvalError } = await supabase
      .from('version_approvals')
      .insert({
        canvas_version_id: canvasVersionId ?? null,
        approved_by: approvedBy,
        review_request_id: reviewRequestId,
        note: note ?? null,
      })

    if (approvalError) {
      return NextResponse.json(
        { success: false, error: `승인 저장 실패: ${approvalError.message}` },
        { status: 500 }
      )
    }

    // 검토 요청 상태 → approved
    await supabase
      .from('review_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', reviewRequestId)

    // 학생에게 알림
    const { data: request } = await supabase
      .from('review_requests')
      .select('requested_by, project_id')
      .eq('id', reviewRequestId)
      .single()

    if (request) {
      await supabase
        .from('notifications')
        .insert({
          user_id: request.requested_by,
          type: 'version_approved',
          title: '버전이 승인되었습니다 ✅',
          message: note ?? '지도교수가 이 버전을 승인했습니다.',
          link: `/lab/${request.project_id}`,
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : '승인 처리 중 오류가 발생했습니다.'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
