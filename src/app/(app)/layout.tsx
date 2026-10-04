import { requireUser } from "@/lib/auth/session"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { AppShell } from "@/components/shell/app-shell"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()
  const preview = !isSupabaseConfigured()
  return (
    <AppShell user={user} preview={preview}>
      {children}
    </AppShell>
  )
}
