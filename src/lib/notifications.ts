import "server-only"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"

export type NotificationRow = {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export async function listNotifications(): Promise<NotificationRow[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, link, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(200)
    if (error) throw error
    return (data ?? []) as NotificationRow[]
  } catch {
    return []
  }
}

export async function getUnreadCount(): Promise<number> {
  if (!isSupabaseConfigured()) return 0
  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false)
    if (error) throw error
    return count ?? 0
  } catch {
    return 0
  }
}

export { NOTIFICATION_ICONS } from "@/lib/notifications-meta"
