import type { Metadata } from "next"
import Link from "next/link"
import { requirePermission } from "@/lib/auth/session"
import { listPayments } from "@/lib/finance/invoices"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { buttonVariants } from "@/components/ui/button"
import { Icon } from "@/components/shared/icon"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatMoney, paiseFromDb } from "@/lib/finance/money"

export const metadata: Metadata = { title: "Payments" }

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default async function PaymentsPage() {
  await requirePermission("payments.view")
  const rows = await listPayments()

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Payments received against invoices. Each one is also recorded as income."
        actions={
          <Link
            href="/finance/invoices"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Icon name="FileText" className="size-4" />
            Invoices
          </Link>
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          icon="CreditCard"
          title="No payments yet"
          description="Payments recorded against invoices appear here."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-muted-foreground">
                      {fmtDate(r.paid_on)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.invoice?.number ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {r.client?.company_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.method?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.reference ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatMoney(paiseFromDb(r.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-2 md:hidden">
            {rows.map((r) => (
              <Card key={r.id} className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {r.client?.company_name ?? "—"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.invoice?.number ?? "—"} · {fmtDate(r.paid_on)}
                    </div>
                  </div>
                  <div className="shrink-0 font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatMoney(paiseFromDb(r.amount))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
