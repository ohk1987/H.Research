import { NextRequest, NextResponse } from 'next/server'
import { callREngine } from '@/lib/r-engine/client'
import type { ANOVAResult } from '@/types/analysis'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, dv, group } = body

    if (!data || !dv || !group) {
      return NextResponse.json(
        { success: false, error: '데이터, 종속변수, 집단변수가 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await callREngine<ANOVAResult>('/analyze/anova', {
      data, dv, group,
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ANOVA 분석 중 오류가 발생했습니다.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
