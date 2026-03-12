import { createClient } from './client'
import type { Notification } from '@/types/lab'

export async function getNotifications(userId: string): Promise<Notification[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(`알림 조회 실패: ${error.message}`)
  return (data ?? []).map(mapNotificationRow)
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) return 0
  return count ?? 0
}

export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
}

export async function markAllAsRead(userId: string): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message?: string,
  link?: string
): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message: message ?? null,
      link: link ?? null,
    })
}

function mapNotificationRow(row: Record<string, unknown>): Notification {
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
