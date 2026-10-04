import type { Metadata } from "next"
import { requirePermission } from "@/lib/auth/session"
import { getManagers } from "@/lib/clients"
import { PageHeader } from "@/components/shared/page-header"
import { ClientForm } from "@/components/clients/client-form"

export const metadata: Metadata = { title: "Add Client" }

export default async function NewClientPage() {
  await requirePermission("clients.manage")
  const managers = await getManagers()
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add Client" description="Create a new client record." />
      <ClientForm managers={managers} />
    </div>
  )
}
