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
import { PROJECT_STATUS } from "@/lib/status"
import { formatMoney, paiseFromDb } from "@/lib/finance/money"
import type { ProjectListRow } from "@/lib/projects"

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "agreement_pending", label: "Agreement Pending" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "closure_pending", label: "Closure Pending" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
]

export function ProjectList({ rows }: { rows: ProjectListRow[] }) {
  const router = useRouter()
  const [q, setQ] = React.useState("")
  const [status, setStatus] = React.useState("all")

  const filtered = rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false
    if (q) {
      const hay = `${r.name} ${r.client?.company_name ?? ""} ${
        r.code ?? ""
      }`.toLowerCase()
      if (!hay.includes(q.toLowerCase())) return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Search project, client…"
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
          icon="FolderKanban"
          title="No projects found"
          description="Create a project to start tracking work and money."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Contract</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/projects/${r.id}`)}
                  >
                    <TableCell className="font-mono text-xs">{r.code}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.client?.company_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.owner?.full_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(paiseFromDb(r.contract_value), "INR", {
                        noDecimals: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge map={PROJECT_STATUS} value={r.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-2 md:hidden">
            {filtered.map((r) => (
              <Card key={r.id} className="p-0">
                <Link
                  href={`/projects/${r.id}`}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{r.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.client?.company_name ?? "—"}
                    </div>
                    <div className="mt-1">
                      <StatusBadge map={PROJECT_STATUS} value={r.status} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-sm font-medium tabular-nums">
                    {formatMoney(paiseFromDb(r.contract_value), "INR", {
                      noDecimals: true,
                    })}
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
