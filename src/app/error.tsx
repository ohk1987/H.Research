"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <AlertTriangle className="mb-4 size-12 text-destructive" />
      <h1 className="mb-2 text-2xl font-bold">오류가 발생했습니다</h1>
      <p className="mb-8 max-w-md text-center text-muted-foreground">
        예상하지 못한 오류가 발생했습니다. 문제가 지속되면 페이지를 새로고침하거나 처음부터 다시 시도해 주세요.
      </p>
      <div className="flex gap-3">
        <Link href="/">
          <Button variant="outline">
            <Home className="size-4" />
            처음으로
          </Button>
        </Link>
        <Button onClick={reset}>
          <RotateCcw className="size-4" />
          다시 시도
        </Button>
      </div>
    </div>
  )
}
