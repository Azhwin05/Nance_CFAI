import type { Metadata } from "next"
import { requirePermission } from "@/lib/auth/session"
import { getInvoiceFormData } from "@/lib/finance/invoices"
import { PageHeader } from "@/components/shared/page-header"
import { InvoiceForm } from "@/components/finance/invoice-form"

export const metadata: Metadata = { title: "New Invoice" }

export default async function NewInvoicePage() {
  await requirePermission("invoices.manage")
  const { clients, projects } = await getInvoiceFormData()

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New Invoice" description="Create an invoice for a client." />
      <InvoiceForm clients={clients} projects={projects} />
    </div>
  )
}
