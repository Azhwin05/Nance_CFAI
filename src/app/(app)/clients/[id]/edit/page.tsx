import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requirePermission } from "@/lib/auth/session"
import { getClient, getManagers } from "@/lib/clients"
import { PageHeader } from "@/components/shared/page-header"
import { ClientForm } from "@/components/clients/client-form"
import type { ClientInput } from "@/lib/validation/client"

export const metadata: Metadata = { title: "Edit Client" }

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission("clients.manage")
  const { id } = await params
  const [client, managers] = await Promise.all([getClient(id), getManagers()])
  if (!client) notFound()
  const c = client as Record<string, any>

  const initial: Partial<ClientInput> = {
    companyName: c.company_name ?? "",
    contactPerson: c.contact_person ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    altPhone: c.alt_phone ?? "",
    gstin: c.gstin ?? "",
    address: c.address ?? "",
    website: c.website ?? "",
    industry: c.industry ?? "",
    status: c.status,
    notes: c.notes ?? "",
    assignedManager: c.assigned_manager ?? null,
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit Client" description={c.company_name} />
      <ClientForm managers={managers} clientId={id} initial={initial} />
    </div>
  )
}
