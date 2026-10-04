"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/session"
import { can } from "@/lib/permissions/roles"
import {
  paiseFromInput,
  paiseToDb,
  addPaise,
  formatMoney,
} from "@/lib/finance/money"
import { nextCode } from "@/lib/finance/expenses"
import {
  invoiceCreateSchema,
  paymentRecordSchema,
  type InvoiceCreateInput,
  type PaymentRecordInput,
} from "@/lib/validation/invoice"

type ActionResult = { error: string } | { ok: true; id?: string }

export async function createInvoice(
  input: InvoiceCreateInput
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "invoices.manage")) {
    return { error: "You don't have permission to create invoices." }
  }
  const parsed = invoiceCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const v = parsed.data
  const supabase = await createClient()

  const subtotal = paiseFromInput(v.subtotal)
  const tax = v.tax ? paiseFromInput(v.tax) : 0
  const total = addPaise(subtotal, tax)
  const number = await nextCode("INV", "invoices")

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      number,
      client_id: v.clientId,
      project_id: v.projectId ?? null,
      issue_date: v.issueDate,
      due_date: v.dueDate || null,
      subtotal: Number(paiseToDb(subtotal)),
      tax_amount: Number(paiseToDb(tax)),
      total: Number(paiseToDb(total)),
      status: "sent",
      notes: v.notes || null,
      created_by: user.id,
    })
    .select("id")
    .single()
  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: "invoice.created",
    p_entity: "invoices",
    p_entity_id: data.id,
    p_summary: `${user.fullName} created ${number} — ${formatMoney(total)}`,
    p_new: { number, total: paiseToDb(total) },
  })

  revalidatePath("/finance/invoices")
  revalidatePath("/dashboard")
  return { ok: true, id: data.id as string }
}

export async function recordPayment(
  input: PaymentRecordInput
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "payments.manage")) {
    return { error: "You don't have permission to record payments." }
  }
  const parsed = paymentRecordSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const v = parsed.data
  const supabase = await createClient()

  // Resolve the invoice's client so the payment is attributed correctly.
  const { data: inv } = await supabase
    .from("invoices")
    .select("client_id, number")
    .eq("id", v.invoiceId)
    .maybeSingle()

  const amountPaise = paiseFromInput(v.amount)

  const { error } = await supabase.from("payments").insert({
    invoice_id: v.invoiceId,
    client_id: inv?.client_id ?? null,
    amount: Number(paiseToDb(amountPaise)),
    paid_on: v.paidOn,
    payment_method_id: v.paymentMethodId ?? null,
    reference: v.reference || null,
    created_by: user.id,
  })
  if (error) return { error: error.message }
  // The DB trigger recomputes the invoice's amount_paid + payment_status.

  await supabase.rpc("write_audit", {
    p_action: "payment.recorded",
    p_entity: "invoices",
    p_entity_id: v.invoiceId,
    p_summary: `${user.fullName} recorded ${formatMoney(amountPaise)} against ${inv?.number ?? "invoice"}`,
    p_new: { amount: paiseToDb(amountPaise) },
  })

  revalidatePath("/finance/invoices")
  revalidatePath(`/finance/invoices/${v.invoiceId}`)
  revalidatePath("/finance/payments")
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function cancelInvoice(id: string): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "invoices.manage")) {
    return { error: "You don't have permission to cancel invoices." }
  }
  const supabase = await createClient()
  const { error } = await supabase
    .from("invoices")
    .update({ status: "cancelled" })
    .eq("id", id)
  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: "invoice.cancelled",
    p_entity: "invoices",
    p_entity_id: id,
    p_summary: `${user.fullName} cancelled an invoice`,
  })
  revalidatePath("/finance/invoices")
  revalidatePath("/dashboard")
  return { ok: true }
}
