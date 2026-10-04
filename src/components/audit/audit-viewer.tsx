"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
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
import { EmptyState } from "@/components/shared/empty-state"
import type { AuditRow } from "@/lib/audit"

const ALL = "all"

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AuditViewer({ rows }: { rows: AuditRow[] }) {
  const [q, setQ] = React.useState("")
  const [entity, setEntity] = React.useState(ALL)

  const entities = React.useMemo(
    () => [...new Set(rows.map((r) => r.entity))].sort(),
    [rows]
  )

  const filtered = rows.filter((r) => {
    if (entity !== ALL && r.entity !== entity) return false
    if (q) {
      const hay = `${r.summary ?? ""} ${r.action} ${r.entity} ${r.actor?.full_name ?? ""}`.toLowerCase()
      if (!hay.includes(q.toLowerCase())) return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Search actions, records, people…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={entity} onValueChange={(v) => setEntity(v ?? ALL)}>
          <SelectTrigger className="sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All records</SelectItem>
            {entities.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="ScrollText"
          title="No audit entries"
          description="Important actions are recorded here as they happen."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>What</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {fmtDateTime(r.created_at)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {r.actor?.full_name ?? "System"}
                    </TableCell>
                    <TableCell>
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                        {r.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.summary ?? `${r.entity} ${r.entity_id ?? ""}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-2 md:hidden">
            {filtered.map((r) => (
              <Card key={r.id} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{r.actor?.full_name ?? "System"}</span>
                  <span className="text-xs text-muted-foreground">
                    {fmtDateTime(r.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-sm">{r.summary ?? r.entity}</p>
                <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                  {r.action}
                </span>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
