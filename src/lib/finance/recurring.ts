import "server-only"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { addPaise, paiseFromDb, type Paise } from "@/lib/finance/money"
import { monthlyEquivalent } from "@/lib/finance/recurrence"

export { monthlyEquivalent }

export type RecurringRevenueRow = {
  id: string
  name: string | null
  amount: number
  frequency: string
  start_date: string
  end_date: string | null
  next_billing: string | null
  is_active: boolean
  client: { id: string; company_name: string } | null
  project: { id: string; name: string } | null
}

export type RecurringExpenseRow = {
  id: string
  name: string
  vendor: string | null
  amount: number
  frequency: string
  start_date: string
  end_date: string | null
  next_due: string | null
  auto_create: boolean
  require_approval: boolean
  is_active: boolean
  category: { name: string; parent: string | null } | null
}

export async function listRecurringRevenues(): Promise<RecurringRevenueRow[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("recurring_revenues")
    .select(
      `id, name, amount, frequency, start_date, end_date, next_billing, is_active,
       client:clients(id, company_name),
       project:projects(id, name)`
    )
    .order("is_active", { ascending: false })
    .order("amount", { ascending: false })
    .limit(500)
  if (error) throw error
  return (data ?? []) as unknown as RecurringRevenueRow[]
}

export async function listRecurringExpenses(): Promise<RecurringExpenseRow[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("recurring_expenses")
    .select(
      `id, name, vendor, amount, frequency, start_date, end_date, next_due,
       auto_create, require_approval, is_active,
       category:expense_categories(name, parent)`
    )
    .order("is_active", { ascending: false })
    .order("next_due", { ascending: true })
    .limit(500)
  if (error) throw error
  return (data ?? []) as unknown as RecurringExpenseRow[]
}

export type MrrSummary = {
  currentMrr: Paise
  activeCount: Paise
  clients: { id: string; name: string; mrr: Paise }[]
}

export async function getMrrSummary(): Promise<MrrSummary> {
  const rows = await listRecurringRevenues()
  const active = rows.filter((r) => r.is_active)
  const currentMrr = addPaise(
    ...active.map((r) => monthlyEquivalent(paiseFromDb(r.amount), r.frequency))
  )
  const byClient = new Map<string, { id: string; name: string; mrr: Paise }>()
  for (const r of active) {
    const id = r.client?.id ?? "—"
    const name = r.client?.company_name ?? "Unassigned"
    const prev = byClient.get(id)?.mrr ?? 0
    byClient.set(id, {
      id,
      name,
      mrr: prev + monthlyEquivalent(paiseFromDb(r.amount), r.frequency),
    })
  }
  return {
    currentMrr,
    activeCount: active.length,
    clients: [...byClient.values()].sort((a, b) => b.mrr - a.mrr),
  }
}

export async function getRecurringFormData() {
  if (!isSupabaseConfigured())
    return { clients: [], projects: [], categories: [] }
  const supabase = await createClient()
  const [clients, projects, categories] = await Promise.all([
    supabase.from("clients").select("id, company_name").order("company_name"),
    supabase.from("projects").select("id, name, client_id").order("name"),
    supabase
      .from("expense_categories")
      .select("id, name, parent")
      .eq("is_active", true)
      .order("parent")
      .order("name"),
  ])
  return {
    clients: clients.data ?? [],
    projects: projects.data ?? [],
    categories: categories.data ?? [],
  }
}
