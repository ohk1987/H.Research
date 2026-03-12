"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Link2, Check } from "lucide-react"

interface ShareButtonProps {
  projectId: string
}

export default function ShareButton({ projectId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const url = `${window.location.origin}/projects/${projectId}/results`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="size-3.5" />
          복사됨
        </>
      ) : (
        <>
          <Link2 className="size-3.5" />
          결과 링크 복사
        </>
      )}
    </Button>
  )
}
