"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/session"
import { can } from "@/lib/permissions/roles"
import { paiseFromInput, paiseToDb, formatMoney } from "@/lib/finance/money"
import { nextCode } from "@/lib/finance/expenses"
import {
  recurringExpenseSchema,
  type RecurringExpenseInput,
} from "@/lib/validation/recurring"

type ActionResult = { error: string } | { ok: true; id?: string }

export async function createRecurringExpense(
  input: RecurringExpenseInput
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "recurring.manage")) {
    return { error: "You don't have permission to manage recurring expenses." }
  }
  const parsed = recurringExpenseSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const v = parsed.data
  const supabase = await createClient()
  const amountPaise = paiseFromInput(v.amount)

  const { data, error } = await supabase
    .from("recurring_expenses")
    .insert({
      name: v.name,
      vendor: v.vendor || null,
      category_id: v.categoryId ?? null,
      amount: Number(paiseToDb(amountPaise)),
      frequency: v.frequency,
      start_date: v.startDate,
      end_date: v.endDate || null,
      next_due: v.nextDue,
      auto_create: v.autoCreate ?? true,
      require_approval: v.requireApproval ?? true,
      is_active: true,
      created_by: user.id,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: "recurring_expense.created",
    p_entity: "recurring_expenses",
    p_entity_id: data.id,
    p_summary: `${user.fullName} added recurring expense "${v.name}" ${formatMoney(amountPaise)} / ${v.frequency}`,
    p_new: { name: v.name, amount: paiseToDb(amountPaise), frequency: v.frequency },
  })

  revalidatePath("/finance/recurring")
  revalidatePath("/dashboard")
  return { ok: true, id: data.id as string }
}

export async function setRecurringExpenseActive(
  id: string,
  active: boolean
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "recurring.manage")) {
    return { error: "You don't have permission to manage recurring expenses." }
  }
  const supabase = await createClient()
  const { error } = await supabase
    .from("recurring_expenses")
    .update({ is_active: active })
    .eq("id", id)
  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: active ? "recurring_expense.activated" : "recurring_expense.deactivated",
    p_entity: "recurring_expenses",
    p_entity_id: id,
    p_summary: `${user.fullName} ${active ? "activated" : "deactivated"} a recurring expense`,
  })

  revalidatePath("/finance/recurring")
  return { ok: true }
}

const STEP_DAYS: Record<string, (d: Date) => void> = {
  weekly: (d) => d.setDate(d.getDate() + 7),
  monthly: (d) => d.setMonth(d.getMonth() + 1),
  quarterly: (d) => d.setMonth(d.getMonth() + 3),
  yearly: (d) => d.setFullYear(d.getFullYear() + 1),
}

function advance(dateStr: string, frequency: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  ;(STEP_DAYS[frequency] ?? STEP_DAYS.monthly)(d)
  return d.toISOString().slice(0, 10)
}

/**
 * Generate the expense transactions that are due today or earlier for every
 * active auto-creating recurring expense. Implemented in TypeScript (rather
 * than exposing the SECURITY DEFINER RPC) so authorization is enforced by the
 * server action + RLS, and the generating user is recorded as the submitter.
 *
 * Expenses are created in the `expected` state and still require confirmation /
 * approval — nothing is auto-marked as paid (spec §29).
 */
export async function generateDueRecurringExpenses(): Promise<
  { error: string } | { ok: true; created: number }
> {
  const user = await requireUser()
  if (!can(user.roles, "recurring.manage")) {
    return { error: "You don't have permission to generate recurring expenses." }
  }
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: due, error } = await supabase
    .from("recurring_expenses")
    .select("id, name, vendor, category_id, amount, frequency, next_due, end_date, require_approval")
    .eq("is_active", true)
    .eq("auto_create", true)
    .not("next_due", "is", null)
    .lte("next_due", today)
  if (error) return { error: error.message }

  let created = 0
  for (const r of due ?? []) {
    const nextDue = r.next_due as string
    if (r.end_date && nextDue > (r.end_date as string)) continue

    // Skip if an expense for this recurring item + due date already exists.
    const { data: existing } = await supabase
      .from("expenses")
      .select("id")
      .eq("recurring_expense_id", r.id)
      .eq("txn_date", nextDue)
      .maybeSingle()

    if (!existing) {
      const code = await nextCode("EXP", "expenses")
      const { error: insErr } = await supabase.from("expenses").insert({
        code,
        category_id: r.category_id,
        vendor: r.vendor,
        amount: r.amount,
        txn_date: nextDue,
        description: r.name,
        is_recurring: true,
        recurring_expense_id: r.id,
        frequency: r.frequency,
        status: r.require_approval ? "pending_approval" : "approved",
        state: "expected",
        submitted_by: user.id,
        created_by: user.id,
      })
      if (!insErr) created += 1
    }

    await supabase
      .from("recurring_expenses")
      .update({ next_due: advance(nextDue, r.frequency as string) })
      .eq("id", r.id)
  }

  if (created > 0) {
    await supabase.rpc("write_audit", {
      p_action: "recurring_expense.generated",
      p_entity: "recurring_expenses",
      // No single entity for a batch summary; the column is nullable server-side.
      p_entity_id: null as unknown as string,
      p_summary: `${user.fullName} generated ${created} due recurring expense${created === 1 ? "" : "s"}`,
    })
  }

  revalidatePath("/finance/recurring")
  revalidatePath("/finance/expenses")
  revalidatePath("/dashboard")
  return { ok: true, created }
}
