"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { Notification } from "@/types/lab"

interface NotificationBellProps {
  userId: string
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showPanel, setShowPanel] = useState(false)

  // 초기 알림 로드
  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('notifications')
          .select()
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (data) {
          const mapped = data.map(mapRow)
          setNotifications(mapped)
          setUnreadCount(mapped.filter((n) => !n.isRead).length)
        }
      } catch {
        // 로드 실패 무시
      }
    }

    load()
  }, [userId])

  // Realtime 구독
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = mapRow(payload.new as Record<string, unknown>)
          setNotifications((prev) => [newNotif, ...prev].slice(0, 50))
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // 읽음 처리
  const handleMarkAsRead = useCallback(async (notifId: string) => {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId)

    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  // 전체 읽음
  const handleMarkAllAsRead = useCallback(async () => {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }, [userId])

  function formatTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return '방금'
    if (minutes < 60) return `${minutes}분 전`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}시간 전`
    const days = Math.floor(hours / 24)
    return `${days}일 전`
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setShowPanel(!showPanel)}
        className="relative"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {showPanel && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPanel(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-card shadow-lg">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold">알림</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary hover:underline"
                >
                  모두 읽음
                </button>
              )}
            </div>

            {/* 알림 목록 */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">알림이 없습니다.</p>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex cursor-pointer flex-col gap-0.5 border-b px-4 py-3 transition-colors hover:bg-muted/50 ${
                    !n.isRead ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    if (!n.isRead) handleMarkAsRead(n.id)
                    if (n.link) window.location.href = n.link
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{n.title}</span>
                    {!n.isRead && (
                      <span className="size-2 rounded-full bg-primary" />
                    )}
                  </div>
                  {n.message && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                  )}
                  <span className="text-[10px] text-muted-foreground">{formatTime(n.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function mapRow(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as string,
    title: row.title as string,
    message: row.message as string | undefined,
    link: row.link as string | undefined,
    isRead: row.is_read as boolean,
    createdAt: row.created_at as string,
  }
}
