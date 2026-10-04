import "server-only"
import { createClient } from "@/lib/supabase/server"
import { addPaise, paiseFromDb, subPaise, type Paise } from "@/lib/finance/money"

export type FinancialRollup = {
  contractValue: Paise
  received: Paise
  outstanding: Paise
  expenses: Paise
  profit: Paise
  mrr: Paise
}

const EMPTY: FinancialRollup = {
  contractValue: 0,
  received: 0,
  outstanding: 0,
  expenses: 0,
  profit: 0,
  mrr: 0,
}

/** Financial rollup for a single project (spec §18). */
export async function getProjectRollup(projectId: string): Promise<FinancialRollup> {
  try {
    const supabase = await createClient()
    const [project, income, invoices, expenses, recurring] = await Promise.all([
      supabase
        .from("projects")
        .select("contract_value, mrr")
        .eq("id", projectId)
        .maybeSingle(),
      supabase
        .from("income_transactions")
        .select("amount")
        .eq("project_id", projectId)
        .eq("voided", false)
        .eq("state", "paid"),
      supabase
        .from("invoices")
        .select("total, amount_paid, status, payment_status")
        .eq("project_id", projectId),
      supabase
        .from("expenses")
        .select("amount")
        .eq("project_id", projectId)
        .eq("voided", false)
        .in("status", ["approved", "paid"]),
      supabase
        .from("recurring_revenues")
        .select("amount")
        .eq("project_id", projectId)
        .eq("is_active", true),
    ])

    const contractValue = paiseFromDb(project.data?.contract_value ?? 0)
    const received = addPaise(
      ...(income.data ?? []).map((r) => paiseFromDb(r.amount))
    )
    const outstanding = addPaise(
      ...(invoices.data ?? [])
        .filter((r) => r.status !== "cancelled")
        .map((r) => subPaise(paiseFromDb(r.total), paiseFromDb(r.amount_paid)))
    )
    const expensesTotal = addPaise(
      ...(expenses.data ?? []).map((r) => paiseFromDb(r.amount))
    )
    const mrr = addPaise(
      ...(recurring.data ?? []).map((r) => paiseFromDb(r.amount))
    )
    return {
      contractValue,
      received,
      outstanding,
      expenses: expensesTotal,
      profit: subPaise(received, expensesTotal),
      mrr,
    }
  } catch {
    return EMPTY
  }
}

/** Financial rollup across all of a client's projects + direct income. */
export async function getClientRollup(clientId: string): Promise<FinancialRollup> {
  try {
    const supabase = await createClient()
    const [projects, income, invoices, expenses, recurring] = await Promise.all([
      supabase.from("projects").select("contract_value").eq("client_id", clientId),
      supabase
        .from("income_transactions")
        .select("amount")
        .eq("client_id", clientId)
        .eq("voided", false)
        .eq("state", "paid"),
      supabase
        .from("invoices")
        .select("total, amount_paid, status")
        .eq("client_id", clientId),
      // expenses tied to this client's projects
      supabase
        .from("expenses")
        .select("amount, projects!inner(client_id)")
        .eq("projects.client_id", clientId)
        .eq("voided", false)
        .in("status", ["approved", "paid"]),
      supabase
        .from("recurring_revenues")
        .select("amount")
        .eq("client_id", clientId)
        .eq("is_active", true),
    ])

    const contractValue = addPaise(
      ...(projects.data ?? []).map((r) => paiseFromDb(r.contract_value))
    )
    const received = addPaise(
      ...(income.data ?? []).map((r) => paiseFromDb(r.amount))
    )
    const outstanding = addPaise(
      ...(invoices.data ?? [])
        .filter((r) => r.status !== "cancelled")
        .map((r) => subPaise(paiseFromDb(r.total), paiseFromDb(r.amount_paid)))
    )
    const expensesTotal = addPaise(
      ...(expenses.data ?? []).map((r) => paiseFromDb(r.amount))
    )
    const mrr = addPaise(
      ...(recurring.data ?? []).map((r) => paiseFromDb(r.amount))
    )
    return {
      contractValue,
      received,
      outstanding,
      expenses: expensesTotal,
      profit: subPaise(received, expensesTotal),
      mrr,
    }
  } catch {
    return EMPTY
  }
}
