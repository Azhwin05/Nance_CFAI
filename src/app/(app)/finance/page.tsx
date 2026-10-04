import type { Metadata } from "next"
import Link from "next/link"
import { requirePermission } from "@/lib/auth/session"
import { getReceivables, getPayables } from "@/lib/finance/overview"
import { getAnalytics } from "@/lib/finance/analytics"
import { formatMoney } from "@/lib/finance/money"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { PAYMENT_STATUS } from "@/lib/status"
import { CashFlowChart } from "@/components/charts/finance-charts"

export const metadata: Metadata = { title: "Finance Overview" }

function fmtDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

const rupees = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n)

export default async function FinanceOverviewPage() {
  await requirePermission("finance.view")
  const [receivables, payables, analytics] = await Promise.all([
    getReceivables(),
    getPayables(),
    getAnalytics(6),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Overview"
        description="Receivables, payables and cash flow at a glance."
      />

      {/* Receivables buckets (spec §32) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Current"
          value={formatMoney(receivables.current, "INR", { noDecimals: true })}
          icon="FileText"
          hint="Not yet due"
        />
        <StatCard
          label="Due soon"
          value={formatMoney(receivables.dueSoon, "INR", { noDecimals: true })}
          icon="Clock"
          tone="warning"
          hint="Within 7 days"
        />
        <StatCard
          label="Overdue"
          value={formatMoney(receivables.overdue, "INR", { noDecimals: true })}
          icon="AlertTriangle"
          tone="negative"
          hint="Past due date"
        />
      </div>

      {/* Cash flow (spec §31) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cash Flow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CashFlowChart data={analytics.cashFlow} />
          {analytics.cashFlow.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Opening</TableHead>
                    <TableHead className="text-right">Money In</TableHead>
                    <TableHead className="text-right">Money Out</TableHead>
                    <TableHead className="text-right">Closing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.cashFlow.map((p) => (
                    <TableRow key={p.label}>
                      <TableCell className="font-medium">{p.label}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {rupees(p.opening)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        +{rupees(p.moneyIn)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">
                        −{rupees(p.moneyOut)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {rupees(p.closing)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Receivables table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receivables</CardTitle>
          </CardHeader>
          <CardContent>
            {receivables.rows.length === 0 ? (
              <EmptyState icon="FileText" title="Nothing outstanding" description="All invoices are settled." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead className="text-right">Overdue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivables.rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <Link
                            href={`/finance/invoices/${r.id}`}
                            className="font-mono text-xs hover:underline"
                          >
                            {r.number}
                          </Link>
                          <div className="mt-1">
                            <StatusBadge map={PAYMENT_STATUS} value={r.paymentStatus} />
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[10rem] truncate">{r.client}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatMoney(r.outstanding)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {fmtDate(r.dueDate)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.daysOverdue > 0 ? (
                            <span className="text-red-600 dark:text-red-400">
                              {r.daysOverdue}d
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payables table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Payables
              <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
                {formatMoney(payables.total, "INR", { noDecimals: true })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payables.rows.length === 0 ? (
              <EmptyState icon="Banknote" title="No upcoming payables" description="Add recurring costs to track obligations." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payables.rows.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium">{p.name}</div>
                          {p.vendor && (
                            <div className="text-xs text-muted-foreground">{p.vendor}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.category ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatMoney(p.amount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {fmtDate(p.dueDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
