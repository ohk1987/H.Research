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
    const { reviewRequestId, authorId, targetType, targetId, content } = body

    if (!reviewRequestId || !authorId || !targetType || !content) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 코멘트 생성
    const { data: comment, error } = await supabase
      .from('review_comments')
      .insert({
        review_request_id: reviewRequestId,
        author_id: authorId,
        target_type: targetType,
        target_id: targetId ?? null,
        content,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: `코멘트 저장 실패: ${error.message}` },
        { status: 500 }
      )
    }

    // 검토 요청 상태 업데이트
    await supabase
      .from('review_requests')
      .update({ status: 'commented', updated_at: new Date().toISOString() })
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
          type: 'comment_added',
          title: '새 코멘트가 달렸습니다',
          message: content.slice(0, 100),
          link: `/lab/${request.project_id}`,
        })
    }

    return NextResponse.json({ success: true, commentId: comment.id })
  } catch (error) {
    const msg = error instanceof Error ? error.message : '코멘트 저장 중 오류가 발생했습니다.'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
