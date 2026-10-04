import type { Metadata } from "next"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth/session"
import { MORE_NAV } from "@/lib/nav"
import { can } from "@/lib/permissions/roles"
import { Icon } from "@/components/shared/icon"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = { title: "More" }

export default async function MorePage() {
  const user = await getCurrentUser()
  const roles = user?.roles ?? []
  const items = MORE_NAV.filter(
    (i) => !i.permission || can(roles, i.permission)
  )

  return (
    <div>
      <PageHeader title="More" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <Card key={item.href} className="p-0">
            <Link
              href={item.href}
              className="flex flex-col items-start gap-3 p-4 hover:bg-muted/50"
            >
              <Icon name={item.icon} className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium">{item.title}</span>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
