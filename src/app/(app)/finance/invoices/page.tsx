import type { Metadata } from "next"
import Link from "next/link"
import { requirePermission, getCurrentUser, userCan } from "@/lib/auth/session"
import { listInvoices } from "@/lib/finance/invoices"
import { PageHeader } from "@/components/shared/page-header"
import { InvoiceList } from "@/components/finance/invoice-list"
import { buttonVariants } from "@/components/ui/button"
import { Icon } from "@/components/shared/icon"

export const metadata: Metadata = { title: "Invoices" }

export default async function InvoicesPage() {
  await requirePermission("invoices.view")
  const user = await getCurrentUser()
  const rows = await listInvoices()
  const canAdd = userCan(user, "invoices.manage")

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Issue and track invoices and receivables."
        actions={
          canAdd ? (
            <Link href="/finance/invoices/new" className={buttonVariants({ size: "sm" })}>
              <Icon name="Plus" className="size-4" />
              New Invoice
            </Link>
          ) : null
        }
      />
      <InvoiceList rows={rows} />
    </div>
  )
}
