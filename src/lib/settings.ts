import "server-only"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import type { Role } from "@/lib/permissions/roles"

export type CompanySettings = {
  company_name: string
  address: string | null
  gstin: string | null
  currency: string
  fy_start_month: number
  onboarded: boolean
  require_expense_proof: boolean
}

const DEFAULT_COMPANY: CompanySettings = {
  company_name: "Clickfield AI",
  address: null,
  gstin: null,
  currency: "INR",
  fy_start_month: 4,
  onboarded: false,
  require_expense_proof: true,
}

export async function getCompanySettings(): Promise<CompanySettings> {
  if (!isSupabaseConfigured()) return DEFAULT_COMPANY
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("company_settings")
      .select("company_name, address, gstin, currency, fy_start_month, onboarded, require_expense_proof")
      .maybeSingle()
    return (data as CompanySettings) ?? DEFAULT_COMPANY
  } catch {
    return DEFAULT_COMPANY
  }
}

export type PaymentMethod = {
  id: string
  name: string
  is_active: boolean
  is_system: boolean
}

export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("payment_methods")
      .select("id, name, is_active, is_system")
      .order("name")
    return (data ?? []) as PaymentMethod[]
  } catch {
    return []
  }
}

export type ExpenseCategory = {
  id: string
  name: string
  parent: string | null
  is_active: boolean
}

export async function listExpenseCategories(): Promise<ExpenseCategory[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("expense_categories")
      .select("id, name, parent, is_active")
      .order("parent")
      .order("name")
    return (data ?? []) as ExpenseCategory[]
  } catch {
    return []
  }
}

export type UserWithRoles = {
  id: string
  full_name: string | null
  email: string | null
  roles: Role[]
}

export async function listUsersWithRoles(): Promise<UserWithRoles[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const [{ data: profiles }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email").order("full_name"),
      supabase.from("user_roles").select("user_id, role"),
    ])
    const byUser = new Map<string, Role[]>()
    for (const r of (roleRows as { user_id: string; role: Role }[] | null) ?? []) {
      const list = byUser.get(r.user_id) ?? []
      list.push(r.role)
      byUser.set(r.user_id, list)
    }
    return ((profiles as { id: string; full_name: string | null; email: string | null }[] | null) ?? []).map(
      (p) => ({ ...p, roles: byUser.get(p.id) ?? [] })
    )
  } catch {
    return []
  }
}
