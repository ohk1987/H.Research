"use client"

import { useState, useCallback, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Send } from "lucide-react"

type QuestionType = 'likert5' | 'likert7' | 'nominal' | 'ordinal' | 'text'

interface DemoQuestion {
  id: string
  text: string
  type: QuestionType
  page: number
  isRequired: boolean
  isReversed?: boolean
  options?: string[]
}

// 데모 설문 문항 (실제로는 API에서 로드)
const DEMO_QUESTIONS: DemoQuestion[] = [
  { id: '1', text: '나는 현재 직무에 만족한다.', type: 'likert5', page: 1, isRequired: true },
  { id: '2', text: '나는 직무를 통해 성취감을 느낀다.', type: 'likert5', page: 1, isRequired: true },
  { id: '3', text: '나는 직무 환경에 불만이 있다.', type: 'likert5', page: 1, isRequired: true, isReversed: true },
  { id: '4', text: '나는 현 조직에 헌신하고 싶다.', type: 'likert5', page: 2, isRequired: true },
  { id: '5', text: '나는 이 조직의 구성원이라는 것이 자랑스럽다.', type: 'likert5', page: 2, isRequired: true },
  { id: '6', text: '성별을 선택해주세요.', type: 'nominal', page: 3, isRequired: true, options: ['남성', '여성', '기타'] },
  { id: '7', text: '연령대를 선택해주세요.', type: 'ordinal', page: 3, isRequired: true, options: ['20대', '30대', '40대', '50대 이상'] },
]

const DEMO_TITLE = '직무태도 연구 설문조사'
const DEMO_DESCRIPTION = '본 설문은 직무만족과 조직몰입에 관한 연구 목적으로 실시됩니다. 응답에는 약 5분이 소요됩니다.'

export default function SurveyRespondentPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const formId = params.formId as string
  const groupToken = searchParams.get('g')

  const [currentPage, setCurrentPage] = useState(0) // 0 = 인트로
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [groupId, setGroupId] = useState<string | null>(null)

  // 그룹 토큰 처리
  useEffect(() => {
    if (groupToken) {
      // TODO: Supabase에서 group_id 조회
      setGroupId(groupToken)
    }
  }, [groupToken])

  // localStorage 임시 저장
  useEffect(() => {
    const saved = localStorage.getItem(`survey_${formId}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setAnswers(parsed.answers ?? {})
        setCurrentPage(parsed.page ?? 0)
      } catch { /* 무시 */ }
    }
  }, [formId])

  useEffect(() => {
    if (currentPage > 0 && !submitted) {
      localStorage.setItem(`survey_${formId}`, JSON.stringify({
        answers,
        page: currentPage,
      }))
    }
  }, [answers, currentPage, formId, submitted])

  const pages = Array.from(new Set(DEMO_QUESTIONS.map((q) => q.page))).sort()
  const totalPages = pages.length
  const currentQuestions = DEMO_QUESTIONS.filter((q) => q.page === pages[currentPage - 1])

  // 응답 설정
  const setAnswer = useCallback((questionId: string, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }, [])

  // 현재 페이지 완료 여부
  const isPageComplete = currentQuestions.every(
    (q) => !q.isRequired || answers[q.id] !== undefined
  )

  // 제출
  const handleSubmit = useCallback(async () => {
    try {
      await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          groupId,
          answers,
        }),
      })
      setSubmitted(true)
      localStorage.removeItem(`survey_${formId}`)
    } catch {
      alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }, [formId, groupId, answers])

  // 리커트 척도 렌더링
  const renderLikert = (question: DemoQuestion, max: number) => {
    const labels = max === 5
      ? ['전혀\n그렇지 않다', '그렇지\n않다', '보통\n이다', '그렇다', '매우\n그렇다']
      : ['전혀\n그렇지 않다', '그렇지\n않다', '약간\n그렇지 않다', '보통\n이다', '약간\n그렇다', '그렇다', '매우\n그렇다']

    return (
      <div className="flex justify-center gap-2">
        {Array.from({ length: max }, (_, i) => i + 1).map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => setAnswer(question.id, val)}
            className={`flex min-w-[52px] flex-col items-center gap-1 rounded-lg border-2 px-3 py-3 text-sm transition-colors ${
              answers[question.id] === val
                ? 'border-primary bg-primary/10 font-medium text-primary'
                : 'border-muted hover:border-primary/30'
            }`}
          >
            <span className="text-lg font-semibold">{val}</span>
            <span className="whitespace-pre-line text-center text-[10px] leading-tight text-muted-foreground">
              {labels[val - 1]}
            </span>
          </button>
        ))}
      </div>
    )
  }

  // 선택지 렌더링
  const renderOptions = (question: DemoQuestion) => (
    <div className="flex flex-wrap gap-2">
      {question.options?.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => setAnswer(question.id, opt)}
          className={`rounded-lg border-2 px-4 py-2 text-sm transition-colors ${
            answers[question.id] === opt
              ? 'border-primary bg-primary/10 font-medium text-primary'
              : 'border-muted hover:border-primary/30'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )

  // 인트로
  if (currentPage === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center gap-6 py-12">
            <h1 className="text-2xl font-bold">{DEMO_TITLE}</h1>
            <p className="text-center text-sm text-muted-foreground leading-relaxed">
              {DEMO_DESCRIPTION}
            </p>
            <p className="text-xs text-muted-foreground">
              예상 소요 시간: 약 5분 · 전체 {totalPages} 페이지
            </p>
            <Button size="lg" onClick={() => setCurrentPage(1)}>
              시작하기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 아웃트로
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Send className="size-8" />
            </div>
            <h2 className="text-xl font-bold">응답이 완료되었습니다</h2>
            <p className="text-center text-sm text-muted-foreground">
              소중한 응답에 감사드립니다.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 문항 페이지
  return (
    <div className="min-h-screen bg-background">
      {/* 진행바 */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{currentPage}/{totalPages} 페이지</span>
            <span>{Math.round((currentPage / totalPages) * 100)}%</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(currentPage / totalPages) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 문항 */}
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="flex flex-col gap-8">
          {currentQuestions.map((q, idx) => (
            <div key={q.id} className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-sm font-medium text-muted-foreground">
                  Q{idx + 1}.
                </span>
                <p className="text-sm font-medium leading-relaxed">{q.text}</p>
                {q.isRequired && <span className="text-destructive">*</span>}
              </div>
              {(q.type === 'likert5') && renderLikert(q, 5)}
              {(q.type === 'likert7') && renderLikert(q, 7)}
              {(q.type === 'nominal' || q.type === 'ordinal') && renderOptions(q)}
              {q.type === 'text' && (
                <textarea
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={(answers[q.id] as string) ?? ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  placeholder="답변을 입력하세요"
                />
              )}
            </div>
          ))}
        </div>

        {/* 네비게이션 */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="size-4" />
            이전
          </Button>

          {currentPage < totalPages ? (
            <Button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={!isPageComplete}
            >
              다음
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isPageComplete}
            >
              <Send className="size-4" />
              제출하기
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
