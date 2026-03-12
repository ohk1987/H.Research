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
    const { projectId, canvasVersionId, requestedBy, requestedTo, message } = body

    if (!projectId || !requestedBy || !requestedTo) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 검토 요청 생성
    const { data: request, error: reqError } = await supabase
      .from('review_requests')
      .insert({
        project_id: projectId,
        canvas_version_id: canvasVersionId ?? null,
        requested_by: requestedBy,
        requested_to: requestedTo,
        message: message ?? null,
        status: 'pending',
      })
      .select()
      .single()

    if (reqError) {
      return NextResponse.json(
        { success: false, error: `검토 요청 생성 실패: ${reqError.message}` },
        { status: 500 }
      )
    }

    // 교수에게 알림 생성
    await supabase
      .from('notifications')
      .insert({
        user_id: requestedTo,
        type: 'review_requested',
        title: '검토 요청이 도착했습니다',
        message: message ?? '분석 결과 검토를 요청합니다.',
        link: `/lab/${projectId}`,
      })

    return NextResponse.json({ success: true, requestId: request.id })
  } catch (error) {
    const msg = error instanceof Error ? error.message : '검토 요청 중 오류가 발생했습니다.'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
