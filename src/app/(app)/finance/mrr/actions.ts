"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/session"
import { can } from "@/lib/permissions/roles"
import { paiseFromInput, paiseToDb, formatMoney } from "@/lib/finance/money"
import {
  recurringRevenueSchema,
  type RecurringRevenueInput,
} from "@/lib/validation/recurring"

type ActionResult = { error: string } | { ok: true; id?: string }

export async function createRecurringRevenue(
  input: RecurringRevenueInput
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "recurring.manage")) {
    return { error: "You don't have permission to manage recurring revenue." }
  }
  const parsed = recurringRevenueSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const v = parsed.data
  const supabase = await createClient()
  const amountPaise = paiseFromInput(v.amount)

  const { data, error } = await supabase
    .from("recurring_revenues")
    .insert({
      client_id: v.clientId,
      project_id: v.projectId ?? null,
      name: v.name || null,
      amount: Number(paiseToDb(amountPaise)),
      frequency: v.frequency,
      start_date: v.startDate,
      end_date: v.endDate || null,
      next_billing: v.nextBilling || null,
      is_active: true,
      created_by: user.id,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: "mrr.created",
    p_entity: "recurring_revenues",
    p_entity_id: data.id,
    p_summary: `${user.fullName} added recurring revenue ${formatMoney(amountPaise)} / ${v.frequency}`,
    p_new: { amount: paiseToDb(amountPaise), frequency: v.frequency },
  })

  revalidatePath("/finance/mrr")
  revalidatePath("/dashboard")
  return { ok: true, id: data.id as string }
}

export async function setRecurringRevenueActive(
  id: string,
  active: boolean
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "recurring.manage")) {
    return { error: "You don't have permission to manage recurring revenue." }
  }
  const supabase = await createClient()
  const { error } = await supabase
    .from("recurring_revenues")
    .update({ is_active: active })
    .eq("id", id)
  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: active ? "mrr.activated" : "mrr.deactivated",
    p_entity: "recurring_revenues",
    p_entity_id: id,
    p_summary: `${user.fullName} ${active ? "activated" : "deactivated"} a recurring revenue`,
  })

  revalidatePath("/finance/mrr")
  revalidatePath("/dashboard")
  return { ok: true }
}
