"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Info } from "lucide-react"

function Tooltip({
  content,
  children,
  className,
}: {
  content: string
  children?: React.ReactNode
  className?: string
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false)
      }
    }
    if (visible) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [visible])

  return (
    <div className={cn("relative inline-flex", className)} ref={ref}>
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(!visible)}
        className="inline-flex items-center text-slate-400 hover:text-slate-600 transition-colors"
      >
        {children ?? <Info className="size-3.5" />}
      </button>
      {visible && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md bg-[#1E2A3A] px-3 py-2 text-xs leading-relaxed text-white shadow-lg max-w-xs">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1E2A3A]" />
        </div>
      )}
    </div>
  )
}

export { Tooltip }
