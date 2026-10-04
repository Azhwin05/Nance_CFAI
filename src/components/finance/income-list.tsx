"use client"

import * as React from "react"
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
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import { formatMoney, paiseFromDb } from "@/lib/finance/money"
import { INCOME_TYPE_LABELS } from "@/lib/validation/income"
import type { IncomeListRow } from "@/lib/finance/income"

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function IncomeList({ rows }: { rows: IncomeListRow[] }) {
  const [q, setQ] = React.useState("")
  const filtered = rows.filter((r) => {
    if (!q) return true
    const hay = `${r.client?.company_name ?? ""} ${r.project?.name ?? ""} ${
      r.reference ?? ""
    } ${r.code ?? ""} ${r.description ?? ""}`.toLowerCase()
    return hay.includes(q.toLowerCase())
  })

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search client, project, reference…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="sm:max-w-xs"
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon="TrendingUp"
          title="No income recorded"
          description="Record money received from clients to see it here."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.code}</TableCell>
                    <TableCell className="font-medium">
                      {r.client?.company_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.project?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {INCOME_TYPE_LABELS[r.income_type] ?? r.income_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fmtDate(r.txn_date)}
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
            {filtered.map((r) => (
              <Card key={r.id} className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {r.client?.company_name ?? "—"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.project?.name ?? "—"} · {fmtDate(r.txn_date)}
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      {INCOME_TYPE_LABELS[r.income_type] ?? r.income_type}
                    </Badge>
                  </div>
                  <div className="shrink-0 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
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
