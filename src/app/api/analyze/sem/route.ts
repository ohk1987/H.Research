import { NextResponse } from 'next/server'
import { callREngine } from '@/lib/r-engine/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data, model, bootstrap, estimator, missing } = body

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { success: false, error: '데이터가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!model || typeof model !== 'string') {
      return NextResponse.json(
        { success: false, error: 'lavaan 모델 문법이 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await callREngine('/analyze/sem', {
      data,
      model,
      bootstrap: bootstrap ?? 5000,
      estimator: estimator ?? 'ML',
      missing: missing ?? 'fiml',
    })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : '구조방정식 분석 중 오류가 발생했습니다.'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
