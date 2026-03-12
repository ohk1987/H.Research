"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { X, Send } from "lucide-react"
import type { ReviewComment } from "@/types/lab"

interface CommentPanelProps {
  reviewRequestId: string
  onClose: () => void
}

const TARGET_TYPES = [
  { value: 'canvas_node', label: '캔버스 노드' },
  { value: 'canvas_edge', label: '캔버스 경로' },
  { value: 'result_table', label: '결과 테이블' },
  { value: 'interpretation', label: '해석' },
  { value: 'fit_index', label: '적합도 지수' },
] as const

// 데모 코멘트
const DEMO_COMMENTS: ReviewComment[] = [
  {
    id: 'c1',
    reviewRequestId: 'rr1',
    authorId: 'prof1',
    authorName: '김교수',
    targetType: 'fit_index',
    content: 'RMSEA가 .048이면 양호한 수준입니다. 문제없습니다.',
    isResolved: false,
    createdAt: '2026-03-12T10:30:00Z',
  },
  {
    id: 'c2',
    reviewRequestId: 'rr1',
    authorId: 'prof1',
    authorName: '김교수',
    targetType: 'canvas_edge',
    targetId: 'edge-1',
    content: '직무만족→조직몰입 경로에서 통제변수를 추가해보세요.',
    isResolved: false,
    createdAt: '2026-03-12T11:00:00Z',
  },
]

export default function CommentPanel({ reviewRequestId, onClose }: CommentPanelProps) {
  const [comments, setComments] = useState<ReviewComment[]>(DEMO_COMMENTS)
  const [newContent, setNewContent] = useState("")
  const [targetType, setTargetType] = useState<string>("canvas_node")
  const [sending, setSending] = useState(false)

  const handleSend = useCallback(async () => {
    if (!newContent.trim()) return
    setSending(true)

    try {
      const res = await fetch('/api/lab/review/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewRequestId,
          authorId: 'current-user', // 실제로는 인증된 사용자 ID
          targetType,
          content: newContent.trim(),
        }),
      })

      if (res.ok) {
        // 로컬 상태에 추가
        const newComment: ReviewComment = {
          id: crypto.randomUUID(),
          reviewRequestId,
          authorId: 'current-user',
          authorName: '나',
          targetType: targetType as ReviewComment['targetType'],
          content: newContent.trim(),
          isResolved: false,
          createdAt: new Date().toISOString(),
        }
        setComments((prev) => [...prev, newComment])
        setNewContent("")
      }
    } catch {
      // 에러 무시 (데모)
    } finally {
      setSending(false)
    }
  }, [reviewRequestId, targetType, newContent])

  const toggleResolved = useCallback((commentId: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, isResolved: !c.isResolved } : c))
    )
  }, [])

  function formatTime(iso: string): string {
    return new Date(iso).toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex h-fit flex-col rounded-lg border bg-card">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">코멘트</h3>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* 코멘트 목록 */}
      <div className="flex max-h-[500px] flex-col gap-3 overflow-y-auto p-4">
        {comments.length === 0 && (
          <p className="text-center text-xs text-muted-foreground">아직 코멘트가 없습니다.</p>
        )}
        {comments.map((c) => (
          <div
            key={c.id}
            className={`flex flex-col gap-1 rounded-md border p-3 text-sm ${
              c.isResolved ? 'border-green-200 bg-green-50/50 opacity-60' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{c.authorName ?? '익명'}</span>
              <span className="text-[10px] text-muted-foreground">{formatTime(c.createdAt)}</span>
            </div>
            <span className="inline-flex w-fit rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {TARGET_TYPES.find((t) => t.value === c.targetType)?.label ?? c.targetType}
            </span>
            <p className="leading-relaxed">{c.content}</p>
            <button
              type="button"
              onClick={() => toggleResolved(c.id)}
              className="self-end text-[10px] text-muted-foreground hover:text-foreground"
            >
              {c.isResolved ? '미해결로 변경' : '해결됨으로 표시'}
            </button>
          </div>
        ))}
      </div>

      {/* 새 코멘트 입력 */}
      <div className="border-t p-3">
        <select
          className="mb-2 w-full rounded-md border bg-background px-2 py-1 text-xs"
          value={targetType}
          onChange={(e) => setTargetType(e.target.value)}
        >
          {TARGET_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <textarea
            className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
            rows={2}
            placeholder="코멘트 입력..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <Button
            size="sm"
            disabled={!newContent.trim() || sending}
            onClick={handleSend}
            className="self-end"
          >
            <Send className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
