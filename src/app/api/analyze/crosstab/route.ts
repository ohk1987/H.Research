import { NextRequest, NextResponse } from 'next/server'
import { callREngine } from '@/lib/r-engine/client'
import type { CrosstabResult } from '@/types/analysis'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, var1, var2 } = body

    if (!data || !var1 || !var2) {
      return NextResponse.json(
        { success: false, error: '데이터와 두 변수가 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await callREngine<CrosstabResult>('/analyze/crosstab', {
      data, var1, var2,
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : '교차분석 중 오류가 발생했습니다.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
