"use client"

import { useCallback, useEffect, useRef } from "react"
import type { NodeRole } from "./ItemPanel"

interface NodeContextMenuProps {
  x: number
  y: number
  nodeId: string
  currentRole: NodeRole | null
  onSetRole: (nodeId: string, role: NodeRole) => void
  onDelete: (nodeId: string) => void
  onClose: () => void
}

const ROLES: { role: NodeRole; label: string; color: string }[] = [
  { role: "independent", label: "독립변수로 설정", color: "text-blue-600" },
  { role: "mediator", label: "매개변수로 설정", color: "text-yellow-600" },
  { role: "moderator", label: "조절변수로 설정", color: "text-amber-600" },
  { role: "dependent", label: "종속변수로 설정", color: "text-green-600" },
]

export default function NodeContextMenu({
  x,
  y,
  nodeId,
  currentRole,
  onSetRole,
  onDelete,
  onClose,
}: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [handleClickOutside])

  return (
    <div
      ref={menuRef}
      className="absolute z-50 min-w-[180px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
      style={{ left: x, top: y }}
    >
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        역할 설정
      </div>
      {ROLES.map(({ role, label, color }) => (
        <button
          key={role}
          type="button"
          onClick={() => {
            onSetRole(nodeId, role)
            onClose()
          }}
          className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-slate-50 ${
            currentRole === role ? "bg-slate-100 font-medium" : ""
          }`}
        >
          <span className={`size-2 rounded-full ${
            role === "independent" ? "bg-blue-400" :
            role === "mediator" ? "bg-yellow-400" :
            role === "moderator" ? "bg-amber-400" :
            "bg-green-400"
          }`} />
          <span className={currentRole === role ? color : "text-[#1E2A3A]"}>{label}</span>
          {currentRole === role && <span className="ml-auto text-[10px] text-slate-400">현재</span>}
        </button>
      ))}
      <div className="my-1 border-t border-slate-100" />
      <button
        type="button"
        onClick={() => {
          onDelete(nodeId)
          onClose()
        }}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
      >
        노드 삭제
      </button>
    </div>
  )
}
