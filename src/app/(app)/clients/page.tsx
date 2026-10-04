import type { Metadata } from "next"
import Link from "next/link"
import { requirePermission, getCurrentUser, userCan } from "@/lib/auth/session"
import { listClients } from "@/lib/clients"
import { PageHeader } from "@/components/shared/page-header"
import { ClientList } from "@/components/clients/client-list"
import { buttonVariants } from "@/components/ui/button"
import { Icon } from "@/components/shared/icon"

export const metadata: Metadata = { title: "Clients" }

export default async function ClientsPage() {
  await requirePermission("clients.view")
  const user = await getCurrentUser()
  const rows = await listClients()
  const canAdd = userCan(user, "clients.manage")

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Companies you work with and their contacts."
        actions={
          canAdd ? (
            <Link href="/clients/new" className={buttonVariants({ size: "sm" })}>
              <Icon name="Plus" className="size-4" />
              Add Client
            </Link>
          ) : null
        }
      />
      <ClientList rows={rows} />
    </div>
  )
}
