"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/session"
import { can } from "@/lib/permissions/roles"
import { nextCode } from "@/lib/finance/expenses"
import { clientSchema, type ClientInput } from "@/lib/validation/client"

type ActionResult = { error: string } | { ok: true; id?: string }

function toRow(v: ClientInput) {
  return {
    company_name: v.companyName,
    contact_person: v.contactPerson || null,
    email: v.email || null,
    phone: v.phone || null,
    alt_phone: v.altPhone || null,
    gstin: v.gstin || null,
    address: v.address || null,
    website: v.website || null,
    industry: v.industry || null,
    status: v.status,
    notes: v.notes || null,
    assigned_manager: v.assignedManager ?? null,
  }
}

export async function createClientRecord(
  input: ClientInput
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "clients.manage")) {
    return { error: "You don't have permission to manage clients." }
  }
  const parsed = clientSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const supabase = await createClient()
  const code = await nextCode("CLI", "clients")

  const { data, error } = await supabase
    .from("clients")
    .insert({ ...toRow(parsed.data), code, created_by: user.id })
    .select("id")
    .single()
  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: "client.created",
    p_entity: "clients",
    p_entity_id: data.id,
    p_summary: `${user.fullName} created client ${parsed.data.companyName}`,
  })

  revalidatePath("/clients")
  return { ok: true, id: data.id as string }
}

export async function updateClientRecord(
  id: string,
  input: ClientInput
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "clients.manage")) {
    return { error: "You don't have permission to manage clients." }
  }
  const parsed = clientSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const supabase = await createClient()
  const { error } = await supabase
    .from("clients")
    .update(toRow(parsed.data))
    .eq("id", id)
  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: "client.updated",
    p_entity: "clients",
    p_entity_id: id,
    p_summary: `${user.fullName} updated client ${parsed.data.companyName}`,
  })

  revalidatePath("/clients")
  revalidatePath(`/clients/${id}`)
  return { ok: true, id }
}

export async function setClientStatus(
  id: string,
  status: ClientInput["status"]
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "clients.manage")) {
    return { error: "You don't have permission to manage clients." }
  }
  const supabase = await createClient()
  const { error } = await supabase
    .from("clients")
    .update({ status })
    .eq("id", id)
  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: "client.status_changed",
    p_entity: "clients",
    p_entity_id: id,
    p_summary: `${user.fullName} set client status to ${status}`,
  })
  revalidatePath("/clients")
  revalidatePath(`/clients/${id}`)
  return { ok: true, id }
}
