"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, CheckCircle } from "lucide-react"

interface ReviewRequestButtonProps {
  projectId: string
  canvasVersionId?: string
}

export default function ReviewRequestButton({ projectId, canvasVersionId }: ReviewRequestButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = useCallback(async () => {
    setSending(true)
    try {
      const res = await fetch('/api/lab/review/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          canvasVersionId: canvasVersionId ?? null,
          requestedBy: 'current-user', // 실제로는 인증된 사용자 ID
          requestedTo: 'supervisor-id', // 실제로는 지도교수 ID
          message: message.trim() || null,
        }),
      })

      if (res.ok) {
        setSent(true)
        setTimeout(() => {
          setShowModal(false)
          setSent(false)
          setMessage("")
        }, 1500)
      }
    } catch {
      alert('검토 요청 중 오류가 발생했습니다.')
    } finally {
      setSending(false)
    }
  }, [projectId, canvasVersionId, message])

  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setShowModal(true)}>
        <Send className="size-4" />
        검토 요청
      </Button>

      {showModal && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowModal(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border bg-card p-4 shadow-lg">
            {sent ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <CheckCircle className="size-8 text-green-600" />
                <p className="text-sm font-medium">검토 요청이 전송되었습니다</p>
              </div>
            ) : (
              <>
                <p className="mb-3 text-sm font-medium">지도교수에게 검토 요청</p>
                <Input
                  placeholder="메시지 (선택)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                    취소
                  </Button>
                  <Button size="sm" disabled={sending} onClick={handleSend}>
                    {sending ? (
                      <><Loader2 className="size-3.5 animate-spin" /> 전송 중...</>
                    ) : (
                      '전송'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
