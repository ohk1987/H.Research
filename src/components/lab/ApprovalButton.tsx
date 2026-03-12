"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle, Loader2 } from "lucide-react"

interface ApprovalButtonProps {
  projectId: string
  reviewRequestId?: string
  canvasVersionId?: string
}

export default function ApprovalButton({ projectId, reviewRequestId, canvasVersionId }: ApprovalButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [note, setNote] = useState("")
  const [sending, setSending] = useState(false)
  const [approved, setApproved] = useState(false)

  const handleApprove = useCallback(async () => {
    setSending(true)
    try {
      const res = await fetch('/api/lab/review/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewRequestId: reviewRequestId ?? 'rr1', // 데모 기본값
          approvedBy: 'current-user', // 실제로는 인증된 교수 ID
          canvasVersionId: canvasVersionId ?? null,
          note: note.trim() || null,
        }),
      })

      if (res.ok) {
        setApproved(true)
        setTimeout(() => {
          setShowModal(false)
        }, 1500)
      }
    } catch {
      alert('승인 처리 중 오류가 발생했습니다.')
    } finally {
      setSending(false)
    }
  }, [reviewRequestId, canvasVersionId, note])

  if (approved) {
    return (
      <Button variant="outline" disabled className="text-green-600">
        <CheckCircle className="size-4" />
        승인 완료
      </Button>
    )
  }

  return (
    <div className="relative">
      <Button onClick={() => setShowModal(true)} className="bg-green-600 hover:bg-green-700">
        <CheckCircle className="size-4" />
        승인
      </Button>

      {showModal && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowModal(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border bg-card p-4 shadow-lg">
            <p className="mb-2 text-sm font-medium">이 버전을 승인하시겠습니까?</p>
            <p className="mb-3 text-xs text-muted-foreground">
              승인하면 학생에게 알림이 전송됩니다.
            </p>
            <Input
              placeholder="코멘트 (선택)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                취소
              </Button>
              <Button
                size="sm"
                disabled={sending}
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700"
              >
                {sending ? (
                  <><Loader2 className="size-3.5 animate-spin" /> 처리 중...</>
                ) : (
                  '승인 확인'
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
