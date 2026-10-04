import "server-only"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { addPaise, paiseFromDb, subPaise, type Paise } from "@/lib/finance/money"

/**
 * CENTRALIZED financial calculations (spec §65).
 * Every dashboard/report figure derives from these functions so totals never
 * diverge between pages. All values are integer paise.
 */

export type DashboardSummary = {
  totalRevenue: Paise
  totalExpenses: Paise
  netProfit: Paise
  mrr: Paise
  receivables: Paise
  upcomingExpenses: Paise
}

const EMPTY: DashboardSummary = {
  totalRevenue: 0,
  totalExpenses: 0,
  netProfit: 0,
  mrr: 0,
  receivables: 0,
  upcomingExpenses: 0,
}

/** Representative demo figures (paise) shown in preview mode only. */
const DEMO_SUMMARY: DashboardSummary = {
  totalRevenue: 48_200_000, // ₹4,82,000
  totalExpenses: 14_350_000, // ₹1,43,500
  netProfit: 33_850_000, // ₹3,38,500
  mrr: 8_200_000, // ₹82,000
  receivables: 9_200_000, // ₹92,000
  upcomingExpenses: 4_500_000, // ₹45,000
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (!isSupabaseConfigured()) return DEMO_SUMMARY
  try {
    const supabase = await createClient()

    const [income, expenses, recurringRev, invoices, recurringExp] =
      await Promise.all([
        supabase
          .from("income_transactions")
          .select("amount")
          .eq("voided", false)
          .eq("state", "paid"),
        supabase
          .from("expenses")
          .select("amount, status")
          .eq("voided", false)
          .in("status", ["approved", "paid"]),
        supabase
          .from("recurring_revenues")
          .select("amount")
          .eq("is_active", true),
        supabase
          .from("invoices")
          .select("total, amount_paid, payment_status, status"),
        supabase
          .from("recurring_expenses")
          .select("amount, next_due")
          .eq("is_active", true),
      ])

    const totalRevenue = addPaise(
      ...(income.data ?? []).map((r) => paiseFromDb(r.amount))
    )
    const totalExpenses = addPaise(
      ...(expenses.data ?? []).map((r) => paiseFromDb(r.amount))
    )
    const mrr = addPaise(
      ...(recurringRev.data ?? []).map((r) => paiseFromDb(r.amount))
    )

    const receivables = addPaise(
      ...(invoices.data ?? [])
        .filter(
          (r) =>
            r.status !== "cancelled" &&
            ["pending", "partially_paid", "overdue"].includes(
              r.payment_status as string
            )
        )
        .map((r) =>
          subPaise(
            paiseFromDb(r.total),
            paiseFromDb(r.amount_paid)
          )
        )
    )

    const horizon = new Date()
    horizon.setDate(horizon.getDate() + 30)
    const upcomingExpenses = addPaise(
      ...(recurringExp.data ?? [])
        .filter((r) => r.next_due && new Date(r.next_due as string) <= horizon)
        .map((r) => paiseFromDb(r.amount))
    )

    return {
      totalRevenue,
      totalExpenses,
      netProfit: subPaise(totalRevenue, totalExpenses),
      mrr,
      receivables,
      upcomingExpenses,
    }
  } catch {
    return EMPTY
  }
}
