"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { PAYMENT_STATUS } from "@/lib/status"
import { formatMoney, paiseFromDb, subPaise } from "@/lib/finance/money"
import type { InvoiceListRow } from "@/lib/finance/invoices"

function fmtDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function InvoiceList({ rows }: { rows: InvoiceListRow[] }) {
  const router = useRouter()
  const [q, setQ] = React.useState("")
  const filtered = rows.filter((r) => {
    if (!q) return true
    const hay = `${r.number} ${r.client?.company_name ?? ""} ${
      r.project?.name ?? ""
    }`.toLowerCase()
    return hay.includes(q.toLowerCase())
  })

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search invoice #, client…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="sm:max-w-xs"
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon="FileText"
          title="No invoices yet"
          description="Create an invoice to start tracking receivables."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const outstanding = subPaise(
                    paiseFromDb(r.total),
                    paiseFromDb(r.amount_paid)
                  )
                  return (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/finance/invoices/${r.id}`)}
                    >
                      <TableCell className="font-mono text-xs">{r.number}</TableCell>
                      <TableCell className="font-medium">
                        {r.client?.company_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {fmtDate(r.due_date)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(paiseFromDb(r.total))}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatMoney(outstanding)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge map={PAYMENT_STATUS} value={r.payment_status} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-2 md:hidden">
            {filtered.map((r) => {
              const outstanding = subPaise(
                paiseFromDb(r.total),
                paiseFromDb(r.amount_paid)
              )
              return (
                <Card key={r.id} className="p-0">
                  <Link
                    href={`/finance/invoices/${r.id}`}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {r.client?.company_name ?? "—"}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {r.number} · due {fmtDate(r.due_date)}
                      </div>
                      <div className="mt-1">
                        <StatusBadge map={PAYMENT_STATUS} value={r.payment_status} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-semibold tabular-nums">
                        {formatMoney(outstanding)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        of {formatMoney(paiseFromDb(r.total))}
                      </div>
                    </div>
                  </Link>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
