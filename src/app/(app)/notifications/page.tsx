import type { Metadata } from "next"
import { requireUser } from "@/lib/auth/session"
import { listNotifications } from "@/lib/notifications"
import { PageHeader } from "@/components/shared/page-header"
import { NotificationList } from "@/components/notifications/notification-list"

export const metadata: Metadata = { title: "Notifications" }

export default async function NotificationsPage() {
  await requireUser()
  const rows = await listNotifications()

  return (
    <div>
      <PageHeader title="Notifications" description="Your in-app alerts." />
      <NotificationList rows={rows} />
    </div>
  )
}
