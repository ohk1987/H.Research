import { NextRequest, NextResponse } from 'next/server'
import { callREngine } from '@/lib/r-engine/client'
import type { HLMResult } from '@/types/analysis'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, outcome, groupVar, modelType, level1Preds, level2Preds } = body

    if (!data || !outcome || !groupVar || !modelType) {
      return NextResponse.json(
        { success: false, error: '데이터, 결과변수, 집단변수, 모델 유형이 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await callREngine<HLMResult>('/analyze/hlm', {
      data,
      outcome,
      groupVar,
      modelType,
      level1Preds: level1Preds ?? [],
      level2Preds: level2Preds ?? [],
    }, 120000)

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'HLM 분석 중 오류가 발생했습니다.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
