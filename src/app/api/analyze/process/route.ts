import { NextRequest, NextResponse } from 'next/server'
import { callREngine } from '@/lib/r-engine/client'
import type { ProcessResult } from '@/types/analysis'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, model, bootstrap, estimator } = body

    if (!data || !model) {
      return NextResponse.json(
        { success: false, error: '데이터와 모형이 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await callREngine<ProcessResult>('/analyze/process', {
      data, model, bootstrap: bootstrap ?? 5000, estimator: estimator ?? 'ML',
    }, 120000)

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PROCESS 분석 중 오류가 발생했습니다.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
