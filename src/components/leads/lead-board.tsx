"use client"

import * as React from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { LEAD_STAGE, statusEntry } from "@/lib/status"
import { LEAD_STAGES } from "@/lib/validation/lead"
import { formatMoney, paiseFromDb, addPaise } from "@/lib/finance/money"
import type { LeadListRow } from "@/lib/leads"

export function LeadBoard({ rows }: { rows: LeadListRow[] }) {
  const [q, setQ] = React.useState("")
  const filtered = rows.filter((r) => {
    if (!q) return true
    const hay = `${r.company} ${r.contact_name ?? ""} ${r.code ?? ""}`.toLowerCase()
    return hay.includes(q.toLowerCase())
  })

  const byStage = (stage: string) => filtered.filter((r) => r.stage === stage)

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="Target"
        title="No leads yet"
        description="Add a lead to start building your pipeline."
      />
    )
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search company, contact…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="sm:max-w-xs"
      />

      <div className="flex gap-3 overflow-x-auto pb-3">
        {LEAD_STAGES.map((stage) => {
          const items = byStage(stage)
          const total = addPaise(
            ...items.map((i) => paiseFromDb(i.estimated_value))
          )
          return (
            <div key={stage} className="w-64 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-sm font-semibold">
                  {statusEntry(LEAD_STAGE, stage).label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="mb-2 px-1 text-xs text-muted-foreground">
                {formatMoney(total, "INR", { noDecimals: true })}
              </div>
              <div className="space-y-2">
                {items.map((r) => (
                  <Card key={r.id} className="p-0">
                    <Link href={`/leads/${r.id}`} className="block p-3">
                      <div className="truncate text-sm font-medium">
                        {r.company}
                      </div>
                      {r.contact_name && (
                        <div className="truncate text-xs text-muted-foreground">
                          {r.contact_name}
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-medium tabular-nums">
                          {formatMoney(paiseFromDb(r.estimated_value), "INR", {
                            noDecimals: true,
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {r.probability}%
                        </span>
                      </div>
                    </Link>
                  </Card>
                ))}
                {items.length === 0 && (
                  <div className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
                    Empty
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
