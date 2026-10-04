"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Icon } from "@/components/shared/icon"
import { ROLE_LABELS } from "@/lib/permissions/roles"
import type {
  CompanySettings,
  PaymentMethod,
  ExpenseCategory,
  UserWithRoles,
} from "@/lib/settings"
import {
  updateCompanySettings,
  addPaymentMethod,
  togglePaymentMethod,
  addExpenseCategory,
} from "@/app/(app)/settings/actions"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export function SettingsPanels({
  company,
  methods,
  categories,
  users,
  canEditCompany,
  canManageFinance,
}: {
  company: CompanySettings
  methods: PaymentMethod[]
  categories: ExpenseCategory[]
  users: UserWithRoles[]
  canEditCompany: boolean
  canManageFinance: boolean
}) {
  return (
    <Tabs defaultValue="company" className="w-full">
      <TabsList className="flex-wrap">
        <TabsTrigger value="company">Company</TabsTrigger>
        <TabsTrigger value="finance">Finance</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="system">System</TabsTrigger>
      </TabsList>

      <TabsContent value="company">
        <CompanyPanel company={company} canEdit={canEditCompany} />
      </TabsContent>
      <TabsContent value="finance">
        <FinancePanel
          methods={methods}
          categories={categories}
          canManage={canManageFinance}
        />
      </TabsContent>
      <TabsContent value="users">
        <UsersPanel users={users} />
      </TabsContent>
      <TabsContent value="system">
        <SystemPanel />
      </TabsContent>
    </Tabs>
  )
}

function CompanyPanel({
  company,
  canEdit,
}: {
  company: CompanySettings
  canEdit: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [companyName, setCompanyName] = React.useState(company.company_name)
  const [address, setAddress] = React.useState(company.address ?? "")
  const [gstin, setGstin] = React.useState(company.gstin ?? "")
  const [currency, setCurrency] = React.useState(company.currency)
  const [fyStartMonth, setFyStartMonth] = React.useState(
    String(company.fy_start_month)
  )
  const [requireProof, setRequireProof] = React.useState(
    company.require_expense_proof
  )

  function save() {
    startTransition(async () => {
      const result = await updateCompanySettings({
        companyName,
        address: address || null,
        gstin: gstin || null,
        currency,
        fyStartMonth: Number(fyStartMonth),
        requireExpenseProof: requireProof,
      })
      if ("error" in result) toast.error(result.error)
      else {
        toast.success("Company settings saved")
        router.refresh()
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Company</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!company.onboarded && canEdit && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            Welcome! Confirm your company details below to finish setting up Nance.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="s-name">Company name</Label>
            <Input
              id="s-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-gstin">GSTIN</Label>
            <Input
              id="s-gstin"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              disabled={!canEdit}
              placeholder="29ABCDE1234F1Z5"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="s-address">Address</Label>
          <Input
            id="s-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={!canEdit}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="s-currency">Currency</Label>
            <Input
              id="s-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              disabled={!canEdit}
              maxLength={8}
            />
          </div>
          <div className="grid gap-2">
            <Label>Financial year starts</Label>
            <Select
              value={fyStartMonth}
              onValueChange={(v) => setFyStartMonth(v ?? "4")}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <div className="text-sm font-medium">Require expense proof</div>
            <div className="text-xs text-muted-foreground">
              Ask submitters to attach a receipt for expenses.
            </div>
          </div>
          <Switch
            checked={requireProof}
            onCheckedChange={setRequireProof}
            disabled={!canEdit}
          />
        </div>
        {canEdit && (
          <div className="flex justify-end">
            <Button onClick={save} disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FinancePanel({
  methods,
  categories,
  canManage,
}: {
  methods: PaymentMethod[]
  categories: ExpenseCategory[]
  canManage: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [methodName, setMethodName] = React.useState("")
  const [catName, setCatName] = React.useState("")
  const [catParent, setCatParent] = React.useState("")

  const grouped = React.useMemo(() => {
    const map = new Map<string, ExpenseCategory[]>()
    for (const c of categories) {
      const k = c.parent ?? "Other"
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(c)
    }
    return [...map.entries()]
  }, [categories])

  function addMethod() {
    startTransition(async () => {
      const result = await addPaymentMethod(methodName)
      if ("error" in result) toast.error(result.error)
      else {
        toast.success("Payment method added")
        setMethodName("")
        router.refresh()
      }
    })
  }

  function toggleMethod(id: string, active: boolean) {
    startTransition(async () => {
      const result = await togglePaymentMethod(id, active)
      if ("error" in result) toast.error(result.error)
      else router.refresh()
    })
  }

  function addCategory() {
    startTransition(async () => {
      const result = await addExpenseCategory(catName, catParent || null)
      if ("error" in result) toast.error(result.error)
      else {
        toast.success("Category added")
        setCatName("")
        setCatParent("")
        router.refresh()
      }
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            {methods.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              >
                <span className={m.is_active ? "" : "text-muted-foreground line-through"}>
                  {m.name}
                </span>
                {canManage && (
                  <Switch
                    checked={m.is_active}
                    onCheckedChange={(v) => toggleMethod(m.id, v)}
                    disabled={pending}
                  />
                )}
              </div>
            ))}
            {methods.length === 0 && (
              <p className="text-sm text-muted-foreground">No payment methods yet.</p>
            )}
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Input
                value={methodName}
                onChange={(e) => setMethodName(e.target.value)}
                placeholder="e.g. Company Card"
              />
              <Button onClick={addMethod} disabled={pending || !methodName.trim()}>
                <Icon name="Plus" className="size-4" />
                Add
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expense categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {grouped.map(([parent, items]) => (
              <div key={parent}>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {parent}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {items.map((c) => (
                    <span
                      key={c.id}
                      className="rounded-full bg-muted px-2 py-0.5 text-xs"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {grouped.length === 0 && (
              <p className="text-sm text-muted-foreground">No categories yet.</p>
            )}
          </div>
          {canManage && (
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Name"
              />
              <Input
                value={catParent}
                onChange={(e) => setCatParent(e.target.value)}
                placeholder="Group (optional)"
              />
              <Button onClick={addCategory} disabled={pending || !catName.trim()}>
                <Icon name="Plus" className="size-4" />
                Add
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function UsersPanel({ users }: { users: UserWithRoles[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Users &amp; roles</CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users yet.</p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex flex-col gap-1 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{u.full_name ?? "—"}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {u.email}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {u.roles.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No role</span>
                  ) : (
                    u.roles.map((r) => (
                      <span
                        key={r}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                      >
                        {ROLE_LABELS[r]}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Role assignment is managed by the Super Admin. New sign-ups get a
          default role automatically.
        </p>
      </CardContent>
    </Card>
  )
}

function SystemPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>In-app notifications are enabled for approvals, payments, overdue invoices and project closure events.</p>
          <p>Email delivery can be connected later without changing how events are recorded.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Authentication and sessions are handled by Supabase Auth.</p>
          <p>Every table is protected by row-level security, and all financial actions are written to the audit log.</p>
        </CardContent>
      </Card>
    </div>
  )
}
