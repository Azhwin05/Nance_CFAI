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
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import type { RecurringExpenseRow } from "@/lib/finance/recurring"
import {
  createRecurringExpense,
  setRecurringExpenseActive,
  generateDueRecurringExpenses,
} from "@/app/(app)/finance/recurring/actions"

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

type Category = { id: string; name: string; parent: string | null }

function fmtDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function isDue(d?: string | null) {
  if (!d) return false
  return new Date(d) <= new Date()
}

export function RecurringExpenseManager({
  rows,
  categories,
  canManage,
}: {
  rows: RecurringExpenseRow[]
  categories: Category[]
  canManage: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const [togglingId, setTogglingId] = React.useState<string | null>(null)

  const [name, setName] = React.useState("")
  const [vendor, setVendor] = React.useState("")
  const [categoryId, setCategoryId] = React.useState(NONE)
  const [amount, setAmount] = React.useState("")
  const [frequency, setFrequency] = React.useState("monthly")
  const [startDate, setStartDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  )
  const [nextDue, setNextDue] = React.useState(
    new Date().toISOString().slice(0, 10)
  )
  const [autoCreate, setAutoCreate] = React.useState(true)
  const [requireApproval, setRequireApproval] = React.useState(true)

  const grouped = React.useMemo(() => {
    const map = new Map<string, Category[]>()
    for (const c of categories) {
      const k = c.parent ?? "Other"
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(c)
    }
    return [...map.entries()]
  }, [categories])

  const dueCount = rows.filter(
    (r) => r.is_active && r.auto_create && isDue(r.next_due)
  ).length

  function resetForm() {
    setName("")
    setVendor("")
    setCategoryId(NONE)
    setAmount("")
    setFrequency("monthly")
    setStartDate(new Date().toISOString().slice(0, 10))
    setNextDue(new Date().toISOString().slice(0, 10))
    setAutoCreate(true)
    setRequireApproval(true)
  }

  function submit() {
    startTransition(async () => {
      const result = await createRecurringExpense({
        name,
        vendor: vendor || null,
        categoryId: categoryId === NONE ? null : categoryId,
        amount,
        frequency: frequency as "weekly" | "monthly" | "quarterly" | "yearly",
        startDate,
        nextDue,
        autoCreate,
        requireApproval,
      })
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Recurring expense added")
      setOpen(false)
      resetForm()
      router.refresh()
    })
  }

  function toggle(id: string, active: boolean) {
    setTogglingId(id)
    startTransition(async () => {
      const result = await setRecurringExpenseActive(id, active)
      if ("error" in result) toast.error(result.error)
      else {
        toast.success(active ? "Activated" : "Deactivated")
        router.refresh()
      }
      setTogglingId(null)
    })
  }

  function generate() {
    startTransition(async () => {
      const result = await generateDueRecurringExpenses()
      if ("error" in result) toast.error(result.error)
      else {
        toast.success(
          result.created > 0
            ? `Created ${result.created} expense${result.created === 1 ? "" : "s"} (pending confirmation)`
            : "Nothing due right now"
        )
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-5">
      {canManage && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            {dueCount > 0 ? (
              <span className="text-amber-600 dark:text-amber-400">
                {dueCount} due to be recorded
              </span>
            ) : (
              "All recurring expenses are up to date"
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generate}
              disabled={pending}
            >
              <Icon name="RefreshCw" className="size-4" />
              Generate due
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger className={buttonVariants({ size: "sm" })}>
                <Icon name="Plus" className="size-4" />
                Add
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add recurring expense</DialogTitle>
                  <DialogDescription>
                    A repeating cost. Due transactions are created as{" "}
                    <em>expected</em> and still need confirmation — nothing is
                    auto-paid.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="re-name">Name</Label>
                      <Input
                        id="re-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Office Rent"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="re-vendor">Vendor (optional)</Label>
                      <Input
                        id="re-vendor"
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                        placeholder="e.g. WeWork"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select
                      value={categoryId}
                      onValueChange={(v) => setCategoryId(v ?? NONE)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Uncategorized</SelectItem>
                        {grouped.map(([parent, items]) => (
                          <SelectGroup key={parent}>
                            <SelectLabel>{parent}</SelectLabel>
                            {items.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="re-amount">Amount (₹)</Label>
                      <Input
                        id="re-amount"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="35000"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Frequency</Label>
                      <Select
                        value={frequency}
                        onValueChange={(v) => setFrequency(v ?? "monthly")}
                      >
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
                      <Label htmlFor="re-start">Start date</Label>
                      <Input
                        id="re-start"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="re-next">Next due date</Label>
                      <Input
                        id="re-next"
                        type="date"
                        value={nextDue}
                        onChange={(e) => setNextDue(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="text-sm font-medium">Auto-create transaction</div>
                      <div className="text-xs text-muted-foreground">
                        Create an expected expense when due.
                      </div>
                    </div>
                    <Switch checked={autoCreate} onCheckedChange={setAutoCreate} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="text-sm font-medium">Require approval</div>
                      <div className="text-xs text-muted-foreground">
                        Generated expenses go through the approval workflow.
                      </div>
                    </div>
                    <Switch
                      checked={requireApproval}
                      onCheckedChange={setRequireApproval}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={pending}
                  >
                    Cancel
                  </Button>
                  <Button onClick={submit} disabled={pending || !name || !amount}>
                    {pending ? "Saving…" : "Add"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon="CalendarClock"
          title="No recurring expenses yet"
          description="Add rent, subscriptions or contractor costs that repeat on a schedule."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Next due</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      {r.vendor && (
                        <div className="text-xs text-muted-foreground">
                          {r.vendor}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.category?.name ?? "—"}
                    </TableCell>
                    <TableCell>{FREQ_LABEL[r.frequency] ?? r.frequency}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(paiseFromDb(r.amount))}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          r.is_active && isDue(r.next_due)
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-muted-foreground"
                        }
                      >
                        {fmtDate(r.next_due)}
                      </span>
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
                    <div className="truncate font-medium">{r.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.category?.name ?? "—"} · {FREQ_LABEL[r.frequency]}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge
                        map={ACTIVE_MAP}
                        value={r.is_active ? "active" : "inactive"}
                      />
                      <span className="text-xs text-muted-foreground">
                        Due {fmtDate(r.next_due)}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right font-semibold tabular-nums">
                    {formatMoney(paiseFromDb(r.amount))}
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
