import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

type ExpenseStatus = Database["public"]["Enums"]["expense_status"]

export type ExpenseListRow = {
  id: string
  code: string | null
  vendor: string | null
  amount: number
  txn_date: string
  status: string
  state: string
  description: string | null
  is_recurring: boolean
  category: { name: string; parent: string | null } | null
  project: { name: string } | null
  submitter: { full_name: string } | null
}

export type ExpenseFilters = {
  status?: string
  q?: string
}

export async function listExpenses(
  filters: ExpenseFilters = {}
): Promise<ExpenseListRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from("expenses")
    .select(
      `id, code, vendor, amount, txn_date, status, state, description, is_recurring,
       category:expense_categories(name, parent),
       project:projects(name),
       submitter:profiles!expenses_submitted_by_fkey(full_name)`
    )
    .eq("voided", false)
    .order("txn_date", { ascending: false })
    .limit(200)

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status as ExpenseStatus)
  }
  if (filters.q) {
    query = query.or(
      `vendor.ilike.%${filters.q}%,description.ilike.%${filters.q}%,code.ilike.%${filters.q}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as ExpenseListRow[]
}

export async function getExpense(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("expenses")
    .select(
      `*,
       category:expense_categories(name, parent),
       project:projects(id, name, code),
       payment_method:payment_methods(name),
       submitter:profiles!expenses_submitted_by_fkey(full_name, email),
       approver:profiles!expenses_approved_by_fkey(full_name),
       proof:documents!expenses_proof_document_id_fkey(id, name, storage_path),
       approvals:expense_approvals(id, action, comment, created_at,
         actor:profiles!expense_approvals_acted_by_fkey(full_name))`
    )
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data as Record<string, unknown> | null
}

export async function getExpenseFormData() {
  const supabase = await createClient()
  const [categories, methods, projects] = await Promise.all([
    supabase
      .from("expense_categories")
      .select("id, name, parent")
      .eq("is_active", true)
      .order("parent", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("payment_methods")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("projects")
      .select("id, name, code, clients(company_name)")
      .order("name", { ascending: true }),
  ])
  return {
    categories: categories.data ?? [],
    methods: methods.data ?? [],
    projects: projects.data ?? [],
  }
}

/**
 * Generate the next sequential code like EXP-001 / INV-002.
 *
 * `column` is the table's identifier column — "code" for most tables but
 * "number" for invoices. The highest existing number is found numerically (not
 * by string order, which would rank INV-999 above INV-1000), and a failed
 * lookup throws rather than silently restarting at 001 and colliding with an
 * existing record.
 */
export async function nextCode(
  prefix: string,
  table: string,
  column: string = "code"
): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from(table as "expenses")
    .select(column)
    .ilike(column, `${prefix}-%`)
    .limit(10000)
  if (error) throw new Error(`Couldn't generate the next ${prefix} number: ${error.message}`)

  let max = 0
  for (const row of (data ?? []) as unknown as Record<string, string | null>[]) {
    const n = parseInt((row[column] ?? "").split("-")[1] ?? "0", 10)
    if (Number.isFinite(n) && n > max) max = n
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`
}
