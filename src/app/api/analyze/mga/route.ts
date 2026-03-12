import { NextRequest, NextResponse } from 'next/server'
import { callREngine } from '@/lib/r-engine/client'
import type { MGAResult } from '@/types/analysis'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, model, group, estimator } = body

    if (!data || !model || !group) {
      return NextResponse.json(
        { success: false, error: '데이터, 모형, 집단변수가 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await callREngine<MGAResult>('/analyze/mga', {
      data, model, group, estimator: estimator ?? 'ML',
    }, 120000)

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'MGA 분석 중 오류가 발생했습니다.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
