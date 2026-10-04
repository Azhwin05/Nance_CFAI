import "server-only"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { addPaise, paiseFromDb, subPaise, type Paise } from "@/lib/finance/money"
import { monthlyEquivalent } from "@/lib/finance/recurrence"

/** A month bucket keyed YYYY-MM with a short display label. */
type MonthKey = { key: string; label: string; start: Date; end: Date }

function lastMonths(n: number): MonthKey[] {
  const out: MonthKey[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    out.push({
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      label: start.toLocaleDateString("en-IN", { month: "short" }),
      start,
      end,
    })
  }
  return out
}

function monthKeyOf(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export type RevenueExpensePoint = {
  label: string
  revenue: number
  expenses: number
  profit: number
}

export type CategorySlice = { name: string; value: number }
export type TrendPoint = { label: string; value: number }
export type CashFlowPoint = {
  label: string
  opening: number
  moneyIn: number
  moneyOut: number
  closing: number
}

export type Analytics = {
  revenueExpenses: RevenueExpensePoint[]
  expenseBreakdown: CategorySlice[]
  mrrTrend: TrendPoint[]
  cashFlow: CashFlowPoint[]
}

const toRupees = (p: Paise) => Math.round(p / 100)

const DEMO: Analytics = {
  revenueExpenses: lastMonths(6).map((m, i) => ({
    label: m.label,
    revenue: 60000 + i * 9000,
    expenses: 22000 + i * 3000,
    profit: 38000 + i * 6000,
  })),
  expenseBreakdown: [
    { name: "Cloud", value: 42000 },
    { name: "Software", value: 23000 },
    { name: "People", value: 180000 },
    { name: "Marketing", value: 31000 },
    { name: "Office", value: 35000 },
    { name: "Other", value: 12000 },
  ],
  mrrTrend: lastMonths(6).map((m, i) => ({ label: m.label, value: 50000 + i * 6000 })),
  cashFlow: lastMonths(6).map((m, i) => {
    const opening = 100000 + i * 30000
    const moneyIn = 60000 + i * 9000
    const moneyOut = 22000 + i * 3000
    return {
      label: m.label,
      opening,
      moneyIn,
      moneyOut,
      closing: opening + moneyIn - moneyOut,
    }
  }),
}

/**
 * All dashboard analytics, derived from real transactions. Everything flows
 * through the same paise layer as the KPI summary so figures never diverge.
 */
export async function getAnalytics(months = 6): Promise<Analytics> {
  if (!isSupabaseConfigured()) return DEMO
  try {
    const supabase = await createClient()
    const buckets = lastMonths(months)
    const windowStart = buckets[0].start.toISOString().slice(0, 10)

    const [income, expenses, recurringRev] = await Promise.all([
      supabase
        .from("income_transactions")
        .select("amount, txn_date")
        .eq("voided", false)
        .eq("state", "paid")
        .gte("txn_date", windowStart),
      supabase
        .from("expenses")
        .select("amount, txn_date, status, category:expense_categories(name, parent)")
        .eq("voided", false)
        .in("status", ["approved", "paid"])
        .gte("txn_date", windowStart),
      supabase
        .from("recurring_revenues")
        .select("amount, frequency, start_date, end_date")
        .eq("is_active", true),
    ])

    // Revenue vs expenses (and profit) per month
    const revByMonth = new Map<string, Paise>()
    for (const r of income.data ?? []) {
      const k = monthKeyOf(r.txn_date as string)
      revByMonth.set(k, (revByMonth.get(k) ?? 0) + paiseFromDb(r.amount))
    }
    const expByMonth = new Map<string, Paise>()
    for (const r of expenses.data ?? []) {
      const k = monthKeyOf(r.txn_date as string)
      expByMonth.set(k, (expByMonth.get(k) ?? 0) + paiseFromDb(r.amount))
    }
    const revenueExpenses: RevenueExpensePoint[] = buckets.map((m) => {
      const revenue = revByMonth.get(m.key) ?? 0
      const expense = expByMonth.get(m.key) ?? 0
      return {
        label: m.label,
        revenue: toRupees(revenue),
        expenses: toRupees(expense),
        profit: toRupees(subPaise(revenue, expense)),
      }
    })

    // Expense breakdown by category group (parent), all-time window
    const breakdown = new Map<string, Paise>()
    for (const r of expenses.data ?? []) {
      const cat = (r.category as { name?: string; parent?: string } | null) ?? null
      const name = cat?.parent || cat?.name || "Other"
      breakdown.set(name, (breakdown.get(name) ?? 0) + paiseFromDb(r.amount))
    }
    const expenseBreakdown: CategorySlice[] = [...breakdown.entries()]
      .map(([name, v]) => ({ name, value: toRupees(v) }))
      .filter((s) => s.value > 0)
      .sort((a, b) => b.value - a.value)

    // MRR trend: active monthly-equivalent MRR live at each month-end
    const mrrTrend: TrendPoint[] = buckets.map((m) => {
      const live = (recurringRev.data ?? []).filter((r) => {
        const start = new Date(r.start_date as string)
        const end = r.end_date ? new Date(r.end_date as string) : null
        return start <= m.end && (!end || end >= m.start)
      })
      const value = addPaise(
        ...live.map((r) =>
          monthlyEquivalent(paiseFromDb(r.amount), r.frequency as string)
        )
      )
      return { label: m.label, value: toRupees(value) }
    })

    // Cash flow: money in (income) vs out (expenses), with running balance
    const allIncome = revenueExpenses // reuse per-month revenue as money-in
    let opening = 0
    // opening balance before the window = cumulative net prior to windowStart
    const [priorIn, priorOut] = await Promise.all([
      supabase
        .from("income_transactions")
        .select("amount")
        .eq("voided", false)
        .eq("state", "paid")
        .lt("txn_date", windowStart),
      supabase
        .from("expenses")
        .select("amount")
        .eq("voided", false)
        .in("status", ["approved", "paid"])
        .lt("txn_date", windowStart),
    ])
    opening = toRupees(
      subPaise(
        addPaise(...(priorIn.data ?? []).map((r) => paiseFromDb(r.amount))),
        addPaise(...(priorOut.data ?? []).map((r) => paiseFromDb(r.amount)))
      )
    )
    const cashFlow: CashFlowPoint[] = allIncome.map((p) => {
      const moneyIn = p.revenue
      const moneyOut = p.expenses
      const point: CashFlowPoint = {
        label: p.label,
        opening,
        moneyIn,
        moneyOut,
        closing: opening + moneyIn - moneyOut,
      }
      opening = point.closing
      return point
    })

    return { revenueExpenses, expenseBreakdown, mrrTrend, cashFlow }
  } catch {
    return {
      revenueExpenses: [],
      expenseBreakdown: [],
      mrrTrend: [],
      cashFlow: [],
    }
  }
}

// ---------------------------------------------------------------------------
// Dashboard alerts (spec §12)
// ---------------------------------------------------------------------------
export type Alert = {
  tone: "warning" | "danger" | "success" | "info"
  icon: string
  message: string
  href?: string
}

const DEMO_ALERTS: Alert[] = [
  { tone: "danger", icon: "AlertTriangle", message: "3 invoices overdue", href: "/finance/invoices" },
  { tone: "warning", icon: "Clock", message: "2 expenses waiting for approval", href: "/finance/expenses" },
  { tone: "success", icon: "CheckCircle2", message: "All recurring expenses recorded", href: "/finance/recurring" },
]

export async function getAlerts(): Promise<Alert[]> {
  if (!isSupabaseConfigured()) return DEMO_ALERTS
  try {
    const supabase = await createClient()
    const today = new Date()
    const weekEnd = new Date()
    weekEnd.setDate(weekEnd.getDate() + 7)
    const todayStr = today.toISOString().slice(0, 10)
    const weekStr = weekEnd.toISOString().slice(0, 10)

    const [overdue, pending, closureBlocked, dueThisWeek, recurringDue] =
      await Promise.all([
        supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .in("payment_status", ["overdue"])
          .neq("status", "cancelled"),
        supabase
          .from("expenses")
          .select("id", { count: "exact", head: true })
          .eq("voided", false)
          .eq("status", "pending_approval"),
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("status", "closure_pending"),
        supabase
          .from("invoices")
          .select("total, amount_paid")
          .neq("status", "cancelled")
          .in("payment_status", ["pending", "partially_paid", "overdue"])
          .not("due_date", "is", null)
          .lte("due_date", weekStr),
        supabase
          .from("recurring_expenses")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true)
          .eq("auto_create", true)
          .not("next_due", "is", null)
          .lte("next_due", todayStr),
      ])

    const alerts: Alert[] = []
    if ((overdue.count ?? 0) > 0) {
      alerts.push({
        tone: "danger",
        icon: "AlertTriangle",
        message: `${overdue.count} invoice${overdue.count === 1 ? "" : "s"} overdue`,
        href: "/finance/invoices",
      })
    }
    if ((pending.count ?? 0) > 0) {
      alerts.push({
        tone: "warning",
        icon: "Clock",
        message: `${pending.count} expense${pending.count === 1 ? "" : "s"} waiting for approval`,
        href: "/finance/expenses",
      })
    }
    if ((closureBlocked.count ?? 0) > 0) {
      alerts.push({
        tone: "warning",
        icon: "FolderKanban",
        message: `${closureBlocked.count} project${closureBlocked.count === 1 ? "" : "s"} pending closure`,
        href: "/projects",
      })
    }
    const dueAmount = addPaise(
      ...(dueThisWeek.data ?? []).map((r) =>
        subPaise(paiseFromDb(r.total), paiseFromDb(r.amount_paid))
      )
    )
    if (dueAmount > 0) {
      const { formatMoney } = await import("@/lib/finance/money")
      alerts.push({
        tone: "info",
        icon: "Banknote",
        message: `${formatMoney(dueAmount, "INR", { noDecimals: true })} receivable due this week`,
        href: "/finance",
      })
    }
    if ((recurringDue.count ?? 0) > 0) {
      alerts.push({
        tone: "warning",
        icon: "CalendarClock",
        message: `${recurringDue.count} recurring expense${recurringDue.count === 1 ? "" : "s"} due to record`,
        href: "/finance/recurring",
      })
    } else {
      alerts.push({
        tone: "success",
        icon: "CheckCircle2",
        message: "All recurring expenses recorded",
        href: "/finance/recurring",
      })
    }
    return alerts
  } catch {
    return []
  }
}
