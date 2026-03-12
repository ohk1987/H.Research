import { NextRequest, NextResponse } from 'next/server'
import { callREngine } from '@/lib/r-engine/client'
import type { CMVResult } from '@/types/analysis'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data } = body

    if (!data) {
      return NextResponse.json(
        { success: false, error: '분석할 데이터가 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await callREngine<CMVResult>('/analyze/cmv', { data })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'CMV 분석 중 오류가 발생했습니다.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
