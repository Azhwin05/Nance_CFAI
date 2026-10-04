import type { Metadata } from "next"
import Link from "next/link"
import { requirePermission, getCurrentUser, userCan } from "@/lib/auth/session"
import { listLeads } from "@/lib/leads"
import { PageHeader } from "@/components/shared/page-header"
import { LeadBoard } from "@/components/leads/lead-board"
import { buttonVariants } from "@/components/ui/button"
import { Icon } from "@/components/shared/icon"

export const metadata: Metadata = { title: "Leads" }

export default async function LeadsPage() {
  await requirePermission("leads.view")
  const user = await getCurrentUser()
  const rows = await listLeads()
  const canAdd = userCan(user, "leads.manage")

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Your sales pipeline from first contact to won."
        actions={
          canAdd ? (
            <Link href="/leads/new" className={buttonVariants({ size: "sm" })}>
              <Icon name="Plus" className="size-4" />
              Add Lead
            </Link>
          ) : null
        }
      />
      <LeadBoard rows={rows} />
    </div>
  )
}
