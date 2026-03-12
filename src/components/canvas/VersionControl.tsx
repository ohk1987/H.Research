"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Clock } from "lucide-react"
import { useProjectStore } from "@/lib/store/project-store"
import type { Node, Edge } from "@xyflow/react"

interface VersionControlProps {
  nodes: Node[]
  edges: Edge[]
}

export default function VersionControl({ nodes, edges }: VersionControlProps) {
  const versions = useProjectStore((s) => s.versions)
  const lastSavedAt = useProjectStore((s) => s.lastSavedAt)
  const saveVersion = useProjectStore((s) => s.saveVersion)

  const [showModal, setShowModal] = useState(false)
  const [versionName, setVersionName] = useState("")
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 자동 임시저장 (30초)
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)

    autoSaveTimer.current = setTimeout(() => {
      if (nodes.length > 0) {
        try {
          localStorage.setItem(
            "h-research-canvas-autosave",
            JSON.stringify({ nodes, edges, savedAt: new Date().toISOString() })
          )
        } catch {
          // 로컬스토리지 용량 초과 시 무시
        }
      }
    }, 30000)

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [nodes, edges])

  function handleSave() {
    if (!versionName.trim()) return
    saveVersion(versionName.trim())
    setVersionName("")
    setShowModal(false)
  }

  function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex items-center gap-3">
      {lastSavedAt && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" />
          <span>마지막 저장: {formatTime(lastSavedAt)}</span>
        </div>
      )}

      <span className="text-xs font-medium text-muted-foreground">
        v{versions.length + 1}
      </span>

      <div className="relative">
        <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
          <Save className="size-3.5" />
          저장
        </Button>

        {showModal && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowModal(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border bg-card p-3 shadow-lg">
              <p className="mb-2 text-sm font-medium">버전 저장</p>
              <Input
                placeholder="버전 이름 (예: 초기 모델)"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  disabled={!versionName.trim()}
                  onClick={handleSave}
                >
                  저장
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
