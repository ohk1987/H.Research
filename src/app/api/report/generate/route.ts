import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sections, format, projectName } = body

    if (!sections || !format) {
      return NextResponse.json(
        { success: false, error: '보고서 섹션과 형식을 선택하세요.' },
        { status: 400 }
      )
    }

    // 선택된 섹션별 데이터 수집
    // 실제로는 분석 결과를 DB에서 가져와서 조합
    const reportData = {
      projectName: projectName ?? '연구 프로젝트',
      sections: sections as string[],
      format: format as string,
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      report: reportData,
    })
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : '보고서 생성 중 오류가 발생했습니다.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
