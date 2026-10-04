"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Icon } from "@/components/shared/icon"
import { EmptyState } from "@/components/shared/empty-state"
import { cn } from "@/lib/utils"
import { NOTIFICATION_ICONS } from "@/lib/notifications-meta"
import type { NotificationRow } from "@/lib/notifications"
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/(app)/notifications/actions"

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  })
}

export function NotificationList({ rows }: { rows: NotificationRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const hasUnread = rows.some((r) => !r.is_read)

  function markAll() {
    startTransition(async () => {
      const result = await markAllNotificationsRead()
      if ("error" in result) toast.error(result.error)
      else router.refresh()
    })
  }

  function openOne(r: NotificationRow) {
    if (!r.is_read) {
      startTransition(async () => {
        await markNotificationRead(r.id)
        router.refresh()
      })
    }
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="Inbox"
        title="You're all caught up"
        description="Approvals, payments and closure alerts will show up here."
      />
    )
  }

  return (
    <div className="space-y-3">
      {hasUnread && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={markAll} disabled={pending}>
            <Icon name="Check" className="size-4" />
            Mark all as read
          </Button>
        </div>
      )}
      <div className="space-y-2">
        {rows.map((r) => {
          const body = (
            <div className="flex items-start gap-3 p-3">
              <div
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                  r.is_read ? "bg-muted" : "bg-primary/10"
                )}
              >
                <Icon
                  name={NOTIFICATION_ICONS[r.type] ?? "Bell"}
                  className={cn(
                    "size-4",
                    r.is_read ? "text-muted-foreground" : "text-primary"
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm", !r.is_read && "font-semibold")}>
                    {r.title}
                  </span>
                  {!r.is_read && (
                    <span className="size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
                {r.body && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{r.body}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {timeAgo(r.created_at)}
                </p>
              </div>
            </div>
          )
          return (
            <Card key={r.id} className={cn("p-0", !r.is_read && "border-primary/30")}>
              {r.link ? (
                <Link href={r.link} onClick={() => openOne(r)} className="block">
                  {body}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openOne(r)}
                  className="block w-full text-left"
                >
                  {body}
                </button>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
