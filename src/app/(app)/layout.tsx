import { requireUser } from "@/lib/auth/session"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getUnreadCount } from "@/lib/notifications"
import { AppShell } from "@/components/shell/app-shell"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()
  const preview = !isSupabaseConfigured()
  const unreadCount = await getUnreadCount()
  return (
    <AppShell user={user} preview={preview} unreadCount={unreadCount}>
      {children}
    </AppShell>
  )
}
