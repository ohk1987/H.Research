import { NextResponse } from 'next/server'
import { SYSTEM_PROMPT } from '@/lib/interpretation/claude-interpreter'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { templateResult, analysisContext } = body

    if (!templateResult) {
      return NextResponse.json(
        { success: false, error: '해석 템플릿 결과가 필요합니다.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      // API 키 없으면 템플릿 결과 그대로 반환
      return NextResponse.json({
        success: true,
        interpretation: templateResult,
      })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `아래는 통계 분석 결과의 규칙 기반 해석입니다. 이를 논문에 바로 사용할 수 있는 수준의 한국어 학술 문체로 다듬어주세요.

프로젝트: ${analysisContext?.projectName || ''}
분석 유형: ${analysisContext?.analysisType || ''}
변수: ${analysisContext?.variables?.join(', ') || ''}

규칙 기반 해석:
${templateResult}

위 내용을 APA 7판 학술 문체로 다듬어 주세요. 수치는 변경하지 마세요.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        interpretation: templateResult,
      })
    }

    const data = await response.json()
    const interpretation = data.content?.[0]?.text || templateResult

    return NextResponse.json({ success: true, interpretation })
  } catch {
    return NextResponse.json(
      { success: false, error: '해석 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
