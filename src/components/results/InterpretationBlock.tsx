"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check, Sparkles, Loader2 } from "lucide-react"

interface InterpretationBlockProps {
  text: string
  onEnhance?: () => Promise<string>
}

export default function InterpretationBlock({ text, onEnhance }: InterpretationBlockProps) {
  const [copied, setCopied] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [displayText, setDisplayText] = useState(text)

  async function handleCopy() {
    await navigator.clipboard.writeText(displayText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleEnhance() {
    if (!onEnhance) return
    setEnhancing(true)
    try {
      const enhanced = await onEnhance()
      setDisplayText(enhanced)
    } finally {
      setEnhancing(false)
    }
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">한국어 해석</span>
        <div className="flex gap-1.5">
          {onEnhance && (
            <Button
              variant="ghost"
              size="xs"
              onClick={handleEnhance}
              disabled={enhancing}
            >
              {enhancing ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Sparkles className="size-3" />
              )}
              AI 다듬기
            </Button>
          )}
          <Button variant="ghost" size="xs" onClick={handleCopy}>
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
      </div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {displayText}
      </div>
    </div>
  )
}
