import { NextRequest, NextResponse } from 'next/server'
import { callREngine } from '@/lib/r-engine/client'
import type { TTestResult } from '@/types/analysis'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, dv, group, ci } = body

    if (!data || !dv || !group) {
      return NextResponse.json(
        { success: false, error: '데이터, 종속변수, 집단변수가 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await callREngine<TTestResult>('/analyze/ttest', {
      data, dv, group, ci: ci ?? 0.95,
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 't-test 분석 중 오류가 발생했습니다.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
