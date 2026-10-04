"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/session"
import { can } from "@/lib/permissions/roles"
import { paiseFromInput, paiseToDb, formatMoney } from "@/lib/finance/money"
import { nextCode } from "@/lib/finance/expenses"
import { incomeCreateSchema, type IncomeCreateInput } from "@/lib/validation/income"

type ActionResult = { error: string } | { ok: true; id?: string }

export async function createIncome(
  input: IncomeCreateInput
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "income.manage")) {
    return { error: "You don't have permission to add income." }
  }
  const parsed = incomeCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const v = parsed.data
  const supabase = await createClient()

  const amountPaise = paiseFromInput(v.amount)
  const code = await nextCode("INC", "income_transactions")

  const { data, error } = await supabase
    .from("income_transactions")
    .insert({
      code,
      client_id: v.clientId ?? null,
      project_id: v.projectId ?? null,
      amount: Number(paiseToDb(amountPaise)),
      txn_date: v.txnDate,
      income_type: v.incomeType,
      payment_method_id: v.paymentMethodId ?? null,
      reference: v.reference || null,
      description: v.description || null,
      state: "paid",
      created_by: user.id,
    })
    .select("id")
    .single()
  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: "income.created",
    p_entity: "income_transactions",
    p_entity_id: data.id,
    p_summary: `${user.fullName} recorded income ${code} — ${formatMoney(amountPaise)}`,
    p_new: { code, amount: paiseToDb(amountPaise) },
  })

  revalidatePath("/finance/income")
  revalidatePath("/dashboard")
  return { ok: true, id: data.id as string }
}

export async function voidIncome(
  id: string,
  reason: string
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "income.manage")) {
    return { error: "You don't have permission to void income." }
  }
  const supabase = await createClient()
  const { error } = await supabase
    .from("income_transactions")
    .update({ voided: true, voided_reason: reason || null })
    .eq("id", id)
  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: "income.voided",
    p_entity: "income_transactions",
    p_entity_id: id,
    p_summary: `${user.fullName} voided an income record — ${reason}`,
  })

  revalidatePath("/finance/income")
  revalidatePath("/dashboard")
  return { ok: true }
}
