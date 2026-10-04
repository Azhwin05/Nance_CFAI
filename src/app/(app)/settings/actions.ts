"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/session"
import { can } from "@/lib/permissions/roles"
import type { CurrentUser } from "@/lib/auth/session"

type ActionResult = { error: string } | { ok: true }

function isAdmin(user: CurrentUser) {
  return user.roles.includes("super_admin") || user.roles.includes("admin")
}

const companySchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  address: z.string().trim().max(500).optional().nullable(),
  gstin: z.string().trim().max(32).optional().nullable(),
  currency: z.string().trim().min(1).max(8),
  fyStartMonth: z.number().int().min(1).max(12),
  requireExpenseProof: z.boolean(),
})

export async function updateCompanySettings(input: {
  companyName: string
  address: string | null
  gstin: string | null
  currency: string
  fyStartMonth: number
  requireExpenseProof: boolean
}): Promise<ActionResult> {
  const user = await requireUser()
  if (!isAdmin(user)) {
    return { error: "Only admins can change company settings." }
  }
  const parsed = companySchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const v = parsed.data
  const supabase = await createClient()
  const { error } = await supabase
    .from("company_settings")
    .update({
      company_name: v.companyName,
      address: v.address || null,
      gstin: v.gstin || null,
      currency: v.currency,
      fy_start_month: v.fyStartMonth,
      require_expense_proof: v.requireExpenseProof,
      onboarded: true,
    })
    .eq("id", true)
  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: "settings.updated",
    p_entity: "company_settings",
    p_entity_id: null as unknown as string,
    p_summary: `${user.fullName} updated company settings`,
  })

  revalidatePath("/settings")
  return { ok: true }
}

export async function addPaymentMethod(name: string): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "income.manage")) {
    return { error: "You don't have permission to manage payment methods." }
  }
  const clean = name.trim()
  if (!clean) return { error: "Enter a name." }
  const supabase = await createClient()
  const { error } = await supabase
    .from("payment_methods")
    .insert({ name: clean, is_active: true })
  if (error) return { error: error.message }
  revalidatePath("/settings")
  return { ok: true }
}

export async function togglePaymentMethod(
  id: string,
  active: boolean
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "income.manage")) {
    return { error: "You don't have permission to manage payment methods." }
  }
  const supabase = await createClient()
  const { error } = await supabase
    .from("payment_methods")
    .update({ is_active: active })
    .eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/settings")
  return { ok: true }
}

export async function addExpenseCategory(
  name: string,
  parent: string | null
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "income.manage")) {
    return { error: "You don't have permission to manage categories." }
  }
  const clean = name.trim()
  if (!clean) return { error: "Enter a category name." }
  const supabase = await createClient()
  const { error } = await supabase
    .from("expense_categories")
    .insert({ name: clean, parent: parent?.trim() || null, is_active: true })
  if (error) return { error: error.message }
  revalidatePath("/settings")
  return { ok: true }
}
