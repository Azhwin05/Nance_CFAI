import "server-only"
import { createClient } from "@/lib/supabase/server"
import { addPaise, paiseFromDb, subPaise, type Paise } from "@/lib/finance/money"

export type Receivable = {
  id: string
  number: string
  client: string
  total: number
  outstanding: Paise
  dueDate: string | null
  paymentStatus: string
  daysOverdue: number
  bucket: "current" | "due_soon" | "overdue"
}

export type ReceivablesView = {
  rows: Receivable[]
  current: Paise
  dueSoon: Paise
  overdue: Paise
}

function daysBetween(due: string): number {
  const d = new Date(due)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / 86_400_000)
}

const EMPTY_RECEIVABLES: ReceivablesView = { rows: [], current: 0, dueSoon: 0, overdue: 0 }

export async function getReceivables(): Promise<ReceivablesView> {
  try {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("invoices")
    .select("id, number, total, amount_paid, due_date, payment_status, status, client:clients(company_name)")
    .neq("status", "cancelled")
    .in("payment_status", ["pending", "partially_paid", "overdue"])
    .order("due_date", { ascending: true })
    .limit(500)
  if (error) throw error

  const weekAhead = new Date()
  weekAhead.setDate(weekAhead.getDate() + 7)

  const rows: Receivable[] = (data ?? [])
    .map((r) => {
      const outstanding = subPaise(
        paiseFromDb(r.total),
        paiseFromDb(r.amount_paid)
      )
      const due = (r.due_date as string | null) ?? null
      const overdueDays = due ? daysBetween(due) : 0
      let bucket: Receivable["bucket"] = "current"
      if (due && overdueDays > 0) bucket = "overdue"
      else if (due && new Date(due) <= weekAhead) bucket = "due_soon"
      return {
        id: r.id as string,
        number: r.number as string,
        client:
          (r.client as { company_name?: string } | null)?.company_name ?? "—",
        total: paiseFromDb(r.total),
        outstanding,
        dueDate: due,
        paymentStatus: r.payment_status as string,
        daysOverdue: overdueDays > 0 ? overdueDays : 0,
        bucket,
      }
    })
    .filter((r) => r.outstanding > 0)

  return {
    rows,
    current: addPaise(...rows.filter((r) => r.bucket === "current").map((r) => r.outstanding)),
    dueSoon: addPaise(...rows.filter((r) => r.bucket === "due_soon").map((r) => r.outstanding)),
    overdue: addPaise(...rows.filter((r) => r.bucket === "overdue").map((r) => r.outstanding)),
  }
  } catch {
    return EMPTY_RECEIVABLES
  }
}

export type Payable = {
  id: string
  name: string
  vendor: string | null
  category: string | null
  amount: Paise
  dueDate: string | null
  frequency: string
}

export type PayablesView = {
  rows: Payable[]
  total: Paise
}

/** Forward-looking obligations: active recurring costs (rent, software, etc.). */
export async function getPayables(): Promise<PayablesView> {
  try {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("recurring_expenses")
    .select("id, name, vendor, amount, next_due, frequency, category:expense_categories(name, parent)")
    .eq("is_active", true)
    .order("next_due", { ascending: true })
    .limit(500)
  if (error) throw error

  const rows: Payable[] = (data ?? []).map((r) => {
    const cat = (r.category as { name?: string; parent?: string } | null) ?? null
    return {
      id: r.id as string,
      name: r.name as string,
      vendor: (r.vendor as string | null) ?? null,
      category: cat?.parent || cat?.name || null,
      amount: paiseFromDb(r.amount),
      dueDate: (r.next_due as string | null) ?? null,
      frequency: r.frequency as string,
    }
  })

  return { rows, total: addPaise(...rows.map((r) => r.amount)) }
  } catch {
    return { rows: [], total: 0 }
  }
}
