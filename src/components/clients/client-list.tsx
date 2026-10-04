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
import { CLIENT_STATUS } from "@/lib/status"
import type { ClientListRow } from "@/lib/clients"

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "prospect", label: "Prospect" },
  { value: "lead", label: "Lead" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
]

export function ClientList({ rows }: { rows: ClientListRow[] }) {
  const router = useRouter()
  const [q, setQ] = React.useState("")
  const [status, setStatus] = React.useState("all")

  const filtered = rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false
    if (q) {
      const hay = `${r.company_name} ${r.contact_person ?? ""} ${
        r.industry ?? ""
      } ${r.code ?? ""}`.toLowerCase()
      if (!hay.includes(q.toLowerCase())) return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Search company, contact…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
          <SelectTrigger className="sm:w-48">
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
          icon="Building2"
          title="No clients found"
          description="Add your first client to get started."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/clients/${r.id}`)}
                  >
                    <TableCell className="font-mono text-xs">{r.code}</TableCell>
                    <TableCell className="font-medium">{r.company_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.contact_person ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.industry ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.manager?.full_name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge map={CLIENT_STATUS} value={r.status} />
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
                  href={`/clients/${r.id}`}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{r.company_name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.contact_person ?? "—"} · {r.industry ?? "—"}
                    </div>
                    <div className="mt-1">
                      <StatusBadge map={CLIENT_STATUS} value={r.status} />
                    </div>
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
