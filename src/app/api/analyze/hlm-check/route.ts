import { NextRequest, NextResponse } from 'next/server'
import { callREngine } from '@/lib/r-engine/client'
import type { HLMPrereqResult } from '@/types/analysis'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, groupVar, targetVars } = body

    if (!data || !groupVar || !targetVars || targetVars.length === 0) {
      return NextResponse.json(
        { success: false, error: '데이터, 집단변수, 분석 대상 변수가 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await callREngine<HLMPrereqResult>(
      '/analyze/hlm/prerequisites',
      { data, groupVar, targetVars },
      120000
    )

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'HLM 사전 검증 중 오류가 발생했습니다.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
