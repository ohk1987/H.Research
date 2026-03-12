import { NextRequest, NextResponse } from 'next/server'
import { callREngine } from '@/lib/r-engine/client'

interface PLSSEMResult {
  success: boolean
  path_coefficients: Record<string, number>
  r_squared: Record<string, number>
  reliability: {
    alpha: Record<string, number>
    rho_c: Record<string, number>
    ave: Record<string, number>
  }
  bootstrap: {
    paths: Record<string, number[]>
  }
  error?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, measurement, structural } = body

    if (!data || !measurement || !structural) {
      return NextResponse.json(
        { success: false, error: '데이터, 측정모형, 구조모형이 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await callREngine<PLSSEMResult>('/analyze/plssem', {
      data, measurement, structural,
    }, 120000)

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PLS-SEM 분석 중 오류가 발생했습니다.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
