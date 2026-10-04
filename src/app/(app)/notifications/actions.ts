"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/session"

type ActionResult = { error: string } | { ok: true }

export async function markNotificationRead(id: string): Promise<ActionResult> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/notifications")
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const user = await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)
  if (error) return { error: error.message }
  revalidatePath("/notifications")
  revalidatePath("/dashboard")
  return { ok: true }
}
