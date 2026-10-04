"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/session"
import { can } from "@/lib/permissions/roles"
import { paiseFromInput, paiseToDb } from "@/lib/finance/money"
import { nextCode } from "@/lib/finance/expenses"
import { leadSchema, LEAD_STAGES, type LeadInput } from "@/lib/validation/lead"

type ActionResult = { error: string } | { ok: true; id?: string }

function toRow(v: LeadInput) {
  return {
    company: v.company,
    contact_name: v.contactName || null,
    contact_email: v.contactEmail || null,
    contact_phone: v.contactPhone || null,
    requirement: v.requirement || null,
    estimated_value: Number(paiseToDb(paiseFromInput(v.estimatedValue ?? "0"))),
    expected_mrr: Number(paiseToDb(paiseFromInput(v.expectedMrr ?? "0"))),
    probability: Math.max(0, Math.min(100, parseInt(v.probability || "0", 10) || 0)),
    expected_close: v.expectedClose || null,
    stage: v.stage,
    notes: v.notes || null,
    owner_id: v.ownerId ?? null,
  }
}

export async function createLead(input: LeadInput): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "leads.manage")) {
    return { error: "You don't have permission to manage leads." }
  }
  const parsed = leadSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const supabase = await createClient()
  const code = await nextCode("LEAD", "leads")
  const { data, error } = await supabase
    .from("leads")
    .insert({ ...toRow(parsed.data), code, created_by: user.id })
    .select("id")
    .single()
  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: "lead.created",
    p_entity: "leads",
    p_entity_id: data.id,
    p_summary: `${user.fullName} created lead ${parsed.data.company}`,
  })
  revalidatePath("/leads")
  return { ok: true, id: data.id as string }
}

export async function updateLead(
  id: string,
  input: LeadInput
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "leads.manage")) {
    return { error: "You don't have permission to manage leads." }
  }
  const parsed = leadSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const supabase = await createClient()
  const { error } = await supabase.from("leads").update(toRow(parsed.data)).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/leads")
  revalidatePath(`/leads/${id}`)
  return { ok: true, id }
}

export async function setLeadStage(
  id: string,
  stage: (typeof LEAD_STAGES)[number]
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "leads.manage")) {
    return { error: "You don't have permission to manage leads." }
  }
  const supabase = await createClient()
  const { error } = await supabase.from("leads").update({ stage }).eq("id", id)
  if (error) return { error: error.message }
  await supabase.rpc("write_audit", {
    p_action: "lead.stage_changed",
    p_entity: "leads",
    p_entity_id: id,
    p_summary: `${user.fullName} moved lead to ${stage.replace("_", " ")}`,
  })
  revalidatePath("/leads")
  revalidatePath(`/leads/${id}`)
  return { ok: true, id }
}

export async function addLeadActivity(
  id: string,
  note: string
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "leads.manage")) {
    return { error: "You don't have permission." }
  }
  if (!note.trim()) return { error: "Note is empty." }
  const supabase = await createClient()
  const { error } = await supabase
    .from("lead_activities")
    .insert({ lead_id: id, note: note.trim(), created_by: user.id })
  if (error) return { error: error.message }
  revalidatePath(`/leads/${id}`)
  return { ok: true, id }
}

/** Convert a won lead into a client (spec §16). */
export async function convertLeadToClient(id: string): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "clients.manage")) {
    return { error: "You don't have permission to create clients." }
  }
  const supabase = await createClient()
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (!lead) return { error: "Lead not found." }
  if (lead.converted_client_id) {
    return { error: "This lead is already converted." }
  }

  const code = await nextCode("CLI", "clients")
  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .insert({
      code,
      company_name: lead.company,
      contact_person: lead.contact_name,
      email: lead.contact_email,
      phone: lead.contact_phone,
      status: "active",
      notes: lead.requirement,
      assigned_manager: lead.owner_id,
      created_by: user.id,
    })
    .select("id")
    .single()
  if (clientErr) return { error: clientErr.message }

  await supabase
    .from("leads")
    .update({ converted_client_id: client.id, stage: "active" })
    .eq("id", id)

  await supabase.rpc("write_audit", {
    p_action: "lead.converted",
    p_entity: "leads",
    p_entity_id: id,
    p_summary: `${user.fullName} converted lead ${lead.company} to a client`,
  })

  revalidatePath("/leads")
  revalidatePath("/clients")
  return { ok: true, id: client.id as string }
}
