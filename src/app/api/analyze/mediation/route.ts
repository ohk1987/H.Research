import { NextResponse } from 'next/server'
import { callREngine } from '@/lib/r-engine/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data, model, bootstrap } = body

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { success: false, error: '데이터가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!model || typeof model !== 'string') {
      return NextResponse.json(
        { success: false, error: '매개분석 모델 문법이 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await callREngine('/analyze/mediation', {
      data,
      model,
      bootstrap: bootstrap ?? 5000,
    })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : '매개효과 분석 중 오류가 발생했습니다.'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
