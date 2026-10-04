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
  type Paise,
} from "@/lib/finance/money"
import { nextCode } from "@/lib/finance/expenses"
import {
  invoiceCreateSchema,
  paymentRecordSchema,
  type InvoiceCreateInput,
  type PaymentRecordInput,
} from "@/lib/validation/invoice"

type ActionResult = { error: string } | { ok: true; id?: string }

type DbClient = Awaited<ReturnType<typeof createClient>>

/**
 * Record cash received against an invoice. This is the single money-in path:
 * it writes BOTH a payment (which the DB trigger uses to recompute the invoice
 * balance) AND a matching paid income_transaction, so the receipt shows up
 * everywhere at once — invoice status, the Income ledger, dashboard revenue and
 * the client/project rollups — from one action. (Non-invoice cash is entered
 * directly on the Income page.)
 */
async function recordCashReceipt(
  supabase: DbClient,
  args: {
    invoiceId: string
    clientId: string | null
    projectId: string | null
    invoiceNumber: string | null
    amountPaise: Paise
    paidOn: string
    paymentMethodId: string | null
    reference: string | null
    userId: string
  }
): Promise<{ error: string } | { ok: true }> {
  const amountDb = Number(paiseToDb(args.amountPaise))

  const { error: payErr } = await supabase.from("payments").insert({
    invoice_id: args.invoiceId,
    client_id: args.clientId,
    amount: amountDb,
    paid_on: args.paidOn,
    payment_method_id: args.paymentMethodId,
    reference: args.reference,
    created_by: args.userId,
  })
  if (payErr) return { error: payErr.message }
  // The DB trigger recomputes the invoice's amount_paid + payment_status.

  // Mirror the receipt into the income ledger so revenue reflects it.
  const code = await nextCode("INC", "income_transactions")
  const { error: incErr } = await supabase.from("income_transactions").insert({
    code,
    client_id: args.clientId,
    project_id: args.projectId,
    invoice_id: args.invoiceId,
    amount: amountDb,
    txn_date: args.paidOn,
    income_type: "one_time",
    payment_method_id: args.paymentMethodId,
    reference: args.reference,
    description: `Payment for ${args.invoiceNumber ?? "invoice"}`,
    state: "paid",
    created_by: args.userId,
  })
  if (incErr) return { error: incErr.message }

  return { ok: true }
}

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

  // Optional: collect the full amount immediately (one-step bill + receive).
  if (v.markPaid) {
    const receipt = await recordCashReceipt(supabase, {
      invoiceId: data.id as string,
      clientId: v.clientId,
      projectId: v.projectId ?? null,
      invoiceNumber: number,
      amountPaise: total,
      paidOn: v.paidOn || v.issueDate,
      paymentMethodId: v.paidMethodId ?? null,
      reference: null,
      userId: user.id,
    })
    if ("error" in receipt) return { error: receipt.error }

    await supabase.rpc("write_audit", {
      p_action: "payment.recorded",
      p_entity: "invoices",
      p_entity_id: data.id,
      p_summary: `${user.fullName} marked ${number} paid in full — ${formatMoney(total)}`,
      p_new: { amount: paiseToDb(total) },
    })
  }

  revalidatePath("/finance/invoices")
  revalidatePath("/finance/income")
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

  // Resolve the invoice's client + project so the receipt is attributed right.
  const { data: inv } = await supabase
    .from("invoices")
    .select("client_id, project_id, number")
    .eq("id", v.invoiceId)
    .maybeSingle()

  const amountPaise = paiseFromInput(v.amount)

  const receipt = await recordCashReceipt(supabase, {
    invoiceId: v.invoiceId,
    clientId: inv?.client_id ?? null,
    projectId: inv?.project_id ?? null,
    invoiceNumber: inv?.number ?? null,
    amountPaise,
    paidOn: v.paidOn,
    paymentMethodId: v.paymentMethodId ?? null,
    reference: v.reference || null,
    userId: user.id,
  })
  if ("error" in receipt) return { error: receipt.error }

  await supabase.rpc("write_audit", {
    p_action: "payment.recorded",
    p_entity: "invoices",
    p_entity_id: v.invoiceId,
    p_summary: `${user.fullName} recorded ${formatMoney(amountPaise)} against ${inv?.number ?? "invoice"}`,
    p_new: { amount: paiseToDb(amountPaise) },
  })

  revalidatePath("/finance/invoices")
  revalidatePath(`/finance/invoices/${v.invoiceId}`)
  revalidatePath("/finance/income")
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
