"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Icon } from "@/components/shared/icon"
import { EmptyState } from "@/components/shared/empty-state"
import { formatMoney, type Paise } from "@/lib/finance/money"
import type { ReportBundle } from "@/lib/reports"

type Col = {
  header: string
  align?: "right"
  money?: boolean
}

type Record_ = {
  date?: string
  cells: (string | number)[] // raw values; money cells are Paise
  search: string
}

type ReportDef = {
  id: string
  label: string
  hasDate: boolean
  columns: Col[]
  records: Record_[]
  totalIndex?: number // column index to total (money)
}

function money(p: Paise) {
  return formatMoney(p, "INR", { noDecimals: true })
}

function fmtDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function ReportsView({ bundle }: { bundle: ReportBundle }) {
  const reports: ReportDef[] = React.useMemo(() => {
    return [
      {
        id: "revenue",
        label: "Revenue Report",
        hasDate: true,
        columns: [
          { header: "Date" },
          { header: "Code" },
          { header: "Client" },
          { header: "Project" },
          { header: "Type" },
          { header: "Amount", align: "right", money: true },
        ],
        totalIndex: 5,
        records: bundle.revenue.map((r) => ({
          date: r.date,
          cells: [r.date, r.code ?? "—", r.client, r.project, r.type, r.amount],
          search: `${r.client} ${r.project} ${r.code ?? ""} ${r.type}`.toLowerCase(),
        })),
      },
      {
        id: "expense",
        label: "Expense Report",
        hasDate: true,
        columns: [
          { header: "Date" },
          { header: "Code" },
          { header: "Vendor" },
          { header: "Category" },
          { header: "Project" },
          { header: "Amount", align: "right", money: true },
        ],
        totalIndex: 5,
        records: bundle.expenses.map((r) => ({
          date: r.date,
          cells: [r.date, r.code ?? "—", r.vendor, r.category, r.project, r.amount],
          search: `${r.vendor} ${r.category} ${r.project} ${r.code ?? ""}`.toLowerCase(),
        })),
      },
      {
        id: "profit",
        label: "Profit Report",
        hasDate: false,
        columns: [
          { header: "Month" },
          { header: "Revenue", align: "right", money: true },
          { header: "Expenses", align: "right", money: true },
          { header: "Profit", align: "right", money: true },
          { header: "Margin %", align: "right" },
        ],
        records: bundle.profit.map((r) => ({
          cells: [r.label, r.revenue, r.expenses, r.profit, `${r.margin}%`],
          search: r.label.toLowerCase(),
        })),
      },
      {
        id: "mrr",
        label: "MRR Report",
        hasDate: false,
        columns: [
          { header: "Client" },
          { header: "MRR", align: "right", money: true },
        ],
        totalIndex: 1,
        records: bundle.mrr.map((r) => ({
          cells: [r.client, r.mrr],
          search: r.client.toLowerCase(),
        })),
      },
      {
        id: "receivables",
        label: "Receivables Report",
        hasDate: false,
        columns: [
          { header: "Invoice" },
          { header: "Client" },
          { header: "Outstanding", align: "right", money: true },
          { header: "Due" },
          { header: "Status" },
        ],
        totalIndex: 2,
        records: bundle.receivables.map((r) => ({
          cells: [r.number, r.client, r.outstanding, r.dueDate ?? "—", r.status],
          search: `${r.number} ${r.client} ${r.status}`.toLowerCase(),
        })),
      },
      {
        id: "project",
        label: "Project Profitability",
        hasDate: false,
        columns: [
          { header: "Project" },
          { header: "Client" },
          { header: "Revenue", align: "right", money: true },
          { header: "Expenses", align: "right", money: true },
          { header: "Profit", align: "right", money: true },
          { header: "Margin %", align: "right" },
        ],
        records: bundle.projectProfit.map((r) => ({
          cells: [r.name, r.client, r.revenue, r.expenses, r.profit, `${r.margin}%`],
          search: `${r.name} ${r.client}`.toLowerCase(),
        })),
      },
    ]
  }, [bundle])

  const [reportId, setReportId] = React.useState("revenue")
  const [q, setQ] = React.useState("")
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")

  const report = reports.find((r) => r.id === reportId)!

  const filtered = report.records.filter((rec) => {
    if (q && !rec.search.includes(q.toLowerCase())) return false
    if (report.hasDate && rec.date) {
      if (from && rec.date < from) return false
      if (to && rec.date > to) return false
    }
    return true
  })

  const total =
    report.totalIndex !== undefined
      ? filtered.reduce(
          (sum, rec) => sum + (Number(rec.cells[report.totalIndex!]) || 0),
          0
        )
      : null

  function renderCell(col: Col, value: string | number) {
    if (col.money) return money(Number(value))
    if (col.header === "Date" || col.header === "Due") return fmtDate(String(value))
    return String(value)
  }

  function exportCsv() {
    const headers = report.columns.map((c) => c.header)
    const lines = [headers]
    for (const rec of filtered) {
      lines.push(
        report.columns.map((c, i) => {
          const v = rec.cells[i]
          if (c.money) return String(Number(v) / 100) // rupees for spreadsheets
          if (c.header === "Date" || c.header === "Due") return v ? String(v) : ""
          return String(v)
        })
      )
    }
    const csv = lines
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell ?? "")
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
          })
          .join(",")
      )
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${report.id}-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-2">
          <Label>Report</Label>
          <Select value={reportId} onValueChange={(v) => setReportId(v ?? "revenue")}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reports.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          {report.hasDate && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="r-from">From</Label>
                <Input
                  id="r-from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="r-to">To</Label>
                <Input
                  id="r-to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-40"
                />
              </div>
            </>
          )}
          <div className="grid gap-2">
            <Label htmlFor="r-search">Search</Label>
            <Input
              id="r-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter…"
              className="w-full sm:w-48"
            />
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Icon name="FileSpreadsheet" className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="BarChart3"
          title="No data for this report"
          description="Try widening the date range or clearing the search."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {report.columns.map((c) => (
                      <TableHead
                        key={c.header}
                        className={c.align === "right" ? "text-right" : ""}
                      >
                        {c.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((rec, ri) => (
                    <TableRow key={ri}>
                      {report.columns.map((c, ci) => (
                        <TableCell
                          key={ci}
                          className={
                            c.align === "right"
                              ? "text-right tabular-nums"
                              : ci === 0
                                ? "font-medium"
                                : "text-muted-foreground"
                          }
                        >
                          {renderCell(c, rec.cells[ci])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
                {total !== null && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={report.totalIndex!}>Total</TableCell>
                      <TableCell
                        className="text-right font-semibold tabular-nums"
                        colSpan={report.columns.length - report.totalIndex!}
                      >
                        {money(total)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
