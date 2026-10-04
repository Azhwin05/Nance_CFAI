import "server-only"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { paiseFromDb, subPaise, type Paise } from "@/lib/finance/money"
import { getMrrSummary } from "@/lib/finance/recurring"

export type RevenueRow = {
  date: string
  code: string | null
  client: string
  project: string
  type: string
  amount: Paise
}

export type ExpenseRow = {
  date: string
  code: string | null
  vendor: string
  category: string
  project: string
  amount: Paise
}

export type ProfitRow = {
  label: string
  revenue: Paise
  expenses: Paise
  profit: Paise
  margin: number
}

export type MrrRow = { client: string; mrr: Paise }

export type ReceivableReportRow = {
  number: string
  client: string
  outstanding: Paise
  dueDate: string | null
  status: string
}

export type ProjectProfitRow = {
  code: string | null
  name: string
  client: string
  revenue: Paise
  expenses: Paise
  profit: Paise
  margin: number
}

export type ReportBundle = {
  revenue: RevenueRow[]
  expenses: ExpenseRow[]
  profit: ProfitRow[]
  mrr: MrrRow[]
  receivables: ReceivableReportRow[]
  projectProfit: ProjectProfitRow[]
}

const EMPTY: ReportBundle = {
  revenue: [],
  expenses: [],
  profit: [],
  mrr: [],
  receivables: [],
  projectProfit: [],
}

function marginPct(revenue: Paise, expenses: Paise): number {
  if (revenue <= 0) return 0
  return Math.round(((revenue - expenses) / revenue) * 1000) / 10
}

/** Build every report dataset over the trailing window (default 12 months). */
export async function getReportBundle(months = 12): Promise<ReportBundle> {
  if (!isSupabaseConfigured()) return EMPTY
  try {
    const supabase = await createClient()
    const start = new Date()
    start.setMonth(start.getMonth() - months)
    const startStr = start.toISOString().slice(0, 10)

    const [income, expenses, invoices, projects] = await Promise.all([
      supabase
        .from("income_transactions")
        .select("code, amount, txn_date, income_type, client:clients(company_name), project:projects(name)")
        .eq("voided", false)
        .eq("state", "paid")
        .gte("txn_date", startStr)
        .order("txn_date", { ascending: false }),
      supabase
        .from("expenses")
        .select("code, amount, txn_date, vendor, category:expense_categories(name, parent), project:projects(name)")
        .eq("voided", false)
        .in("status", ["approved", "paid"])
        .gte("txn_date", startStr)
        .order("txn_date", { ascending: false }),
      supabase
        .from("invoices")
        .select("number, total, amount_paid, due_date, payment_status, status, client:clients(company_name)")
        .neq("status", "cancelled")
        .in("payment_status", ["pending", "partially_paid", "overdue"]),
      supabase
        .from("projects")
        .select("id, code, name, client:clients(company_name)"),
    ])

    const revenue: RevenueRow[] = (income.data ?? []).map((r) => ({
      date: r.txn_date as string,
      code: (r.code as string | null) ?? null,
      client: (r.client as { company_name?: string } | null)?.company_name ?? "—",
      project: (r.project as { name?: string } | null)?.name ?? "—",
      type: (r.income_type as string) ?? "one_time",
      amount: paiseFromDb(r.amount),
    }))

    const expenseRows: ExpenseRow[] = (expenses.data ?? []).map((r) => {
      const cat = (r.category as { name?: string; parent?: string } | null) ?? null
      return {
        date: r.txn_date as string,
        code: (r.code as string | null) ?? null,
        vendor: (r.vendor as string | null) ?? "—",
        category: cat?.name ?? cat?.parent ?? "Uncategorized",
        project: (r.project as { name?: string } | null)?.name ?? "—",
        amount: paiseFromDb(r.amount),
      }
    })

    // Monthly profit series
    const byMonth = new Map<string, { rev: Paise; exp: Paise }>()
    const monthLabel = (d: string) =>
      new Date(d).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
    const monthKey = (d: string) => {
      const dt = new Date(d)
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`
    }
    const labelByKey = new Map<string, string>()
    for (const r of revenue) {
      const k = monthKey(r.date)
      labelByKey.set(k, monthLabel(r.date))
      const cur = byMonth.get(k) ?? { rev: 0, exp: 0 }
      cur.rev += r.amount
      byMonth.set(k, cur)
    }
    for (const r of expenseRows) {
      const k = monthKey(r.date)
      labelByKey.set(k, monthLabel(r.date))
      const cur = byMonth.get(k) ?? { rev: 0, exp: 0 }
      cur.exp += r.amount
      byMonth.set(k, cur)
    }
    const profit: ProfitRow[] = [...byMonth.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([k, v]) => ({
        label: labelByKey.get(k) ?? k,
        revenue: v.rev,
        expenses: v.exp,
        profit: subPaise(v.rev, v.exp),
        margin: marginPct(v.rev, v.exp),
      }))

    // MRR by client
    const mrrSummary = await getMrrSummary()
    const mrr: MrrRow[] = mrrSummary.clients.map((c) => ({
      client: c.name,
      mrr: c.mrr,
    }))

    // Receivables
    const receivables: ReceivableReportRow[] = (invoices.data ?? [])
      .map((r) => ({
        number: r.number as string,
        client: (r.client as { company_name?: string } | null)?.company_name ?? "—",
        outstanding: subPaise(paiseFromDb(r.total), paiseFromDb(r.amount_paid)),
        dueDate: (r.due_date as string | null) ?? null,
        status: r.payment_status as string,
      }))
      .filter((r) => r.outstanding > 0)

    // Project profitability — revenue/expenses attributed per project name
    const revByProject = new Map<string, Paise>()
    for (const r of revenue)
      revByProject.set(r.project, (revByProject.get(r.project) ?? 0) + r.amount)
    const expByProject = new Map<string, Paise>()
    for (const r of expenseRows)
      expByProject.set(r.project, (expByProject.get(r.project) ?? 0) + r.amount)

    const projectProfit: ProjectProfitRow[] = (projects.data ?? []).map((p) => {
      const name = p.name as string
      const rev = revByProject.get(name) ?? 0
      const exp = expByProject.get(name) ?? 0
      return {
        code: (p.code as string | null) ?? null,
        name,
        client: (p.client as { company_name?: string } | null)?.company_name ?? "—",
        revenue: rev,
        expenses: exp,
        profit: subPaise(rev, exp),
        margin: marginPct(rev, exp),
      }
    })

    return { revenue, expenses: expenseRows, profit, mrr, receivables, projectProfit }
  } catch {
    return EMPTY
  }
}
