import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { requirePermission, getCurrentUser, userCan } from "@/lib/auth/session"
import { getInvoice, getInvoiceFormData } from "@/lib/finance/invoices"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/status-badge"
import { PAYMENT_STATUS, INVOICE_STATUS } from "@/lib/status"
import { formatMoney, paiseFromDb, subPaise } from "@/lib/finance/money"
import { RecordPayment } from "@/components/finance/record-payment"

export const metadata: Metadata = { title: "Invoice" }

function fmtDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  )
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission("invoices.view")
  const { id } = await params
  const user = await getCurrentUser()
  const invoice = await getInvoice(id)
  if (!invoice) notFound()

  const inv = invoice as Record<string, any>
  const total = paiseFromDb(inv.total)
  const paid = paiseFromDb(inv.amount_paid)
  const outstanding = subPaise(total, paid)
  const canPay =
    userCan(user, "payments.manage") &&
    inv.status !== "cancelled" &&
    outstanding > 0

  const { methods } = await getInvoiceFormData()
  const payments = (inv.payments ?? []).filter(
    (p: Record<string, any>) => !p.voided
  ) as Array<Record<string, any>>

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/finance/invoices"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to invoices
      </Link>

      <PageHeader
        title={inv.number}
        description={inv.client?.company_name ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge map={PAYMENT_STATUS} value={inv.payment_status} />
            {canPay && (
              <RecordPayment
                invoiceId={inv.id}
                methods={methods}
                defaultAmount={(outstanding / 100).toString()}
              />
            )}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">
              {formatMoney(total)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Paid</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatMoney(paid)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Outstanding</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
              {formatMoney(outstanding)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="divide-y">
            <Row label="Invoice status">
              <StatusBadge map={INVOICE_STATUS} value={inv.status} />
            </Row>
            <Row label="Client">{inv.client?.company_name ?? "—"}</Row>
            <Row label="Project">{inv.project?.name ?? "—"}</Row>
            <Row label="Issue date">{fmtDate(inv.issue_date)}</Row>
            <Row label="Due date">{fmtDate(inv.due_date)}</Row>
            <Row label="Subtotal">{formatMoney(paiseFromDb(inv.subtotal))}</Row>
            <Row label="Tax">{formatMoney(paiseFromDb(inv.tax_amount))}</Row>
            <Row label="Notes">{inv.notes || "—"}</Row>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payments recorded yet.
            </p>
          ) : (
            <div className="divide-y">
              {payments
                .sort(
                  (a, b) =>
                    new Date(b.paid_on).getTime() - new Date(a.paid_on).getTime()
                )
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">
                        {fmtDate(p.paid_on)}
                        {p.method?.name ? ` · ${p.method.name}` : ""}
                      </div>
                      {p.reference && (
                        <div className="text-xs text-muted-foreground">
                          {p.reference}
                        </div>
                      )}
                    </div>
                    <div className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatMoney(paiseFromDb(p.amount))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
