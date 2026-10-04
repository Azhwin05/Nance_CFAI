"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button, buttonVariants } from "@/components/ui/button"
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Icon } from "@/components/shared/icon"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { formatMoney, paiseFromDb } from "@/lib/finance/money"
import { monthlyEquivalent } from "@/lib/finance/recurrence"
import type {
  RecurringRevenueRow,
  MrrSummary,
} from "@/lib/finance/recurring"
import {
  createRecurringRevenue,
  setRecurringRevenueActive,
} from "@/app/(app)/finance/mrr/actions"

const NONE = "__none__"
const FREQ_LABEL: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
}
const ACTIVE_MAP = {
  active: { label: "Active", tone: "success" as const },
  inactive: { label: "Inactive", tone: "muted" as const },
}

type Client = { id: string; company_name: string }
type Project = { id: string; name: string; client_id: string }

function fmtDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function MrrManager({
  rows,
  summary,
  clients,
  projects,
  canManage,
}: {
  rows: RecurringRevenueRow[]
  summary: MrrSummary
  clients: Client[]
  projects: Project[]
  canManage: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const [togglingId, setTogglingId] = React.useState<string | null>(null)

  const [clientId, setClientId] = React.useState("")
  const [projectId, setProjectId] = React.useState(NONE)
  const [name, setName] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [frequency, setFrequency] = React.useState("monthly")
  const [startDate, setStartDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  )
  const [nextBilling, setNextBilling] = React.useState("")

  const projectsForClient = projects.filter(
    (p) => !clientId || p.client_id === clientId
  )

  function resetForm() {
    setClientId("")
    setProjectId(NONE)
    setName("")
    setAmount("")
    setFrequency("monthly")
    setStartDate(new Date().toISOString().slice(0, 10))
    setNextBilling("")
  }

  function submit() {
    startTransition(async () => {
      const result = await createRecurringRevenue({
        clientId,
        projectId: projectId === NONE ? null : projectId,
        name: name || undefined,
        amount,
        frequency: frequency as "weekly" | "monthly" | "quarterly" | "yearly",
        startDate,
        nextBilling: nextBilling || null,
      })
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Recurring revenue added")
      setOpen(false)
      resetForm()
      router.refresh()
    })
  }

  function toggle(id: string, active: boolean) {
    setTogglingId(id)
    startTransition(async () => {
      const result = await setRecurringRevenueActive(id, active)
      if ("error" in result) toast.error(result.error)
      else {
        toast.success(active ? "Activated" : "Deactivated")
        router.refresh()
      }
      setTogglingId(null)
    })
  }

  return (
    <div className="space-y-6">
      {/* MRR dashboard figures (spec §30) */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current MRR</span>
              <Icon name="Repeat" className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {formatMoney(summary.currentMrr, "INR", { noDecimals: true })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-sm text-muted-foreground">Annual run-rate</span>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {formatMoney(summary.currentMrr * 12, "INR", { noDecimals: true })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-sm text-muted-foreground">Active streams</span>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {summary.activeCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-sm text-muted-foreground">Clients with MRR</span>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {summary.clients.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {canManage && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className={buttonVariants({ size: "sm" })}>
              <Icon name="Plus" className="size-4" />
              Add recurring revenue
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add recurring revenue</DialogTitle>
                <DialogDescription>
                  A repeating income commitment that contributes to MRR.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Client</Label>
                  <Select
                    value={clientId}
                    onValueChange={(v) => {
                      setClientId(v ?? "")
                      setProjectId(NONE)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Project (optional)</Label>
                  <Select
                    value={projectId}
                    onValueChange={(v) => setProjectId(v ?? NONE)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No specific project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>No specific project</SelectItem>
                      {projectsForClient.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mrr-name">Label (optional)</Label>
                  <Input
                    id="mrr-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Hosting & maintenance retainer"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="mrr-amount">Amount (₹)</Label>
                    <Input
                      id="mrr-amount"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="25000"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Frequency</Label>
                    <Select value={frequency} onValueChange={(v) => setFrequency(v ?? "monthly")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FREQ_LABEL).map(([v, l]) => (
                          <SelectItem key={v} value={v}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="mrr-start">Start date</Label>
                    <Input
                      id="mrr-start"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mrr-next">Next billing (optional)</Label>
                    <Input
                      id="mrr-next"
                      type="date"
                      value={nextBilling}
                      onChange={(e) => setNextBilling(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                  Cancel
                </Button>
                <Button onClick={submit} disabled={pending || !clientId || !amount}>
                  {pending ? "Saving…" : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Client-level MRR (spec §30) */}
      {summary.clients.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-semibold">MRR by client</h3>
            <div className="space-y-1">
              {summary.clients.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <span className="truncate">{c.name}</span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(c.mrr, "INR", { noDecimals: true })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All recurring revenue streams */}
      {rows.length === 0 ? (
        <EmptyState
          icon="Repeat"
          title="No recurring revenue yet"
          description="Add retainers or subscriptions to start tracking MRR."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client / Project</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">MRR</TableHead>
                  <TableHead>Next billing</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">
                        {r.client?.company_name ?? "—"}
                      </div>
                      {r.project && (
                        <div className="text-xs text-muted-foreground">
                          {r.project.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.name ?? "—"}
                    </TableCell>
                    <TableCell>{FREQ_LABEL[r.frequency] ?? r.frequency}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(paiseFromDb(r.amount))}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(
                        monthlyEquivalent(paiseFromDb(r.amount), r.frequency),
                        "INR",
                        { noDecimals: true }
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fmtDate(r.next_billing)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        map={ACTIVE_MAP}
                        value={r.is_active ? "active" : "inactive"}
                      />
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending && togglingId === r.id}
                          onClick={() => toggle(r.id, !r.is_active)}
                        >
                          {r.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-2 md:hidden">
            {rows.map((r) => (
              <Card key={r.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {r.client?.company_name ?? "—"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.name ?? r.project?.name ?? FREQ_LABEL[r.frequency]}
                    </div>
                    <div className="mt-1">
                      <StatusBadge
                        map={ACTIVE_MAP}
                        value={r.is_active ? "active" : "inactive"}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-semibold tabular-nums">
                      {formatMoney(
                        monthlyEquivalent(paiseFromDb(r.amount), r.frequency),
                        "INR",
                        { noDecimals: true }
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">/ mo</div>
                  </div>
                </div>
                {canManage && (
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending && togglingId === r.id}
                      onClick={() => toggle(r.id, !r.is_active)}
                    >
                      {r.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
