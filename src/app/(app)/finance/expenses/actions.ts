"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/session"
import { can } from "@/lib/permissions/roles"
import { paiseFromInput, paiseToDb, formatMoney } from "@/lib/finance/money"
import { nextCode } from "@/lib/finance/expenses"
import {
  expenseCreateSchema,
  expenseDecisionSchema,
  type ExpenseCreateInput,
  type ExpenseDecisionInput,
} from "@/lib/validation/expense"

type ActionResult = { error: string } | { ok: true; id?: string }

export async function createExpense(
  input: ExpenseCreateInput
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "expenses.submit")) {
    return { error: "You don't have permission to submit expenses." }
  }

  const parsed = expenseCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const v = parsed.data
  const supabase = await createClient()

  // Optional proof document (already uploaded to the private bucket client-side)
  let proofDocumentId: string | null = null
  if (v.proofPath) {
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .insert({
        name: v.proofName ?? "proof",
        doc_type: "expense_proof",
        bucket: "documents",
        storage_path: v.proofPath,
        mime_type: v.proofMime ?? null,
        size_bytes: v.proofSize ?? null,
        uploaded_by: user.id,
      })
      .select("id")
      .single()
    if (docErr) return { error: `Couldn't save the proof: ${docErr.message}` }
    proofDocumentId = doc.id as string
  }

  const amountPaise = paiseFromInput(v.amount)
  const code = await nextCode("EXP", "expenses")

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      code,
      category_id: v.categoryId ?? null,
      vendor: v.vendor,
      amount: Number(paiseToDb(amountPaise)),
      txn_date: v.txnDate,
      payment_method_id: v.paymentMethodId ?? null,
      description: v.description || null,
      project_id: v.projectId ?? null,
      is_recurring: v.isRecurring ?? false,
      status: "pending_approval",
      state: "pending",
      proof_document_id: proofDocumentId,
      submitted_by: user.id,
      created_by: user.id,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: "expense.submitted",
    p_entity: "expenses",
    p_entity_id: data.id,
    p_summary: `${user.fullName} submitted ${code} — ${v.vendor} ${formatMoney(amountPaise)}`,
    p_new: { code, vendor: v.vendor, amount: paiseToDb(amountPaise) },
  })

  revalidatePath("/finance/expenses")
  revalidatePath("/dashboard")
  return { ok: true, id: data.id as string }
}

export async function decideExpense(
  input: ExpenseDecisionInput
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "expenses.approve")) {
    return { error: "You don't have permission to approve expenses." }
  }
  const parsed = expenseDecisionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const { expenseId, action, comment } = parsed.data
  const supabase = await createClient()

  const { data: existing, error: fetchErr } = await supabase
    .from("expenses")
    .select("status, code, vendor, amount")
    .eq("id", expenseId)
    .maybeSingle()
  if (fetchErr) return { error: fetchErr.message }
  if (!existing) return { error: "Expense not found." }
  if (!["pending_approval", "changes_requested"].includes(existing.status)) {
    return { error: `This expense is already ${existing.status}.` }
  }

  const update: {
    status: "approved" | "rejected" | "changes_requested"
    approved_by?: string
    approved_at?: string
    state?: "approved"
  } = { status: action }
  if (action === "approved") {
    update.approved_by = user.id
    update.approved_at = new Date().toISOString()
    update.state = "approved"
  }

  const { error } = await supabase
    .from("expenses")
    .update(update)
    .eq("id", expenseId)
  if (error) return { error: error.message }

  await supabase.from("expense_approvals").insert({
    expense_id: expenseId,
    action,
    comment: comment || null,
    acted_by: user.id,
  })

  await supabase.rpc("write_audit", {
    p_action: `expense.${action}`,
    p_entity: "expenses",
    p_entity_id: expenseId,
    p_summary: `${user.fullName} ${action.replace("_", " ")} ${existing.code ?? "expense"}`,
    p_old: { status: existing.status },
    p_new: { status: action, comment },
  })

  revalidatePath("/finance/expenses")
  revalidatePath(`/finance/expenses/${expenseId}`)
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function voidExpense(
  expenseId: string,
  reason: string
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "expenses.approve")) {
    return { error: "You don't have permission to void expenses." }
  }
  const supabase = await createClient()
  const { error } = await supabase
    .from("expenses")
    .update({ voided: true, status: "void", voided_reason: reason || null })
    .eq("id", expenseId)
  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: "expense.voided",
    p_entity: "expenses",
    p_entity_id: expenseId,
    p_summary: `${user.fullName} voided an expense — ${reason}`,
  })

  revalidatePath("/finance/expenses")
  revalidatePath("/dashboard")
  return { ok: true }
}
