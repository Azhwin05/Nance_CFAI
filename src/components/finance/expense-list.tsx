"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { EXPENSE_STATUS } from "@/lib/status"
import { formatMoney, paiseFromDb } from "@/lib/finance/money"
import type { ExpenseListRow } from "@/lib/finance/expenses"

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "approved", label: "Approved" },
  { value: "changes_requested", label: "Changes Requested" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
]

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function ExpenseList({ rows }: { rows: ExpenseListRow[] }) {
  const router = useRouter()
  const [q, setQ] = React.useState("")
  const [status, setStatus] = React.useState("all")

  const filtered = rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false
    if (q) {
      const hay = `${r.vendor ?? ""} ${r.description ?? ""} ${r.code ?? ""} ${
        r.category?.name ?? ""
      }`.toLowerCase()
      if (!hay.includes(q.toLowerCase())) return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Search vendor, category, code…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="TrendingDown"
          title="No expenses found"
          description="Try changing the filters, or add a new expense."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/finance/expenses/${r.id}`)}
                  >
                    <TableCell className="font-mono text-xs">{r.code}</TableCell>
                    <TableCell className="font-medium">{r.vendor}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.category?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fmtDate(r.txn_date)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(paiseFromDb(r.amount))}
                    </TableCell>
                    <TableCell>
                      <StatusBadge map={EXPENSE_STATUS} value={r.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-2 md:hidden">
            {filtered.map((r) => (
              <Card key={r.id} className="p-0">
                <Link
                  href={`/finance/expenses/${r.id}`}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{r.vendor}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.category?.name ?? "—"} · {fmtDate(r.txn_date)}
                    </div>
                    <div className="mt-1">
                      <StatusBadge map={EXPENSE_STATUS} value={r.status} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right font-semibold tabular-nums">
                    {formatMoney(paiseFromDb(r.amount))}
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
