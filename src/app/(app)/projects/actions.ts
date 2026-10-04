"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/session"
import { can } from "@/lib/permissions/roles"
import { paiseFromInput, paiseToDb } from "@/lib/finance/money"
import { nextCode } from "@/lib/finance/expenses"
import { getClosureBlockers } from "@/lib/projects"
import {
  projectSchema,
  milestoneSchema,
  PROJECT_STATUSES,
  type ProjectInput,
  type MilestoneInput,
} from "@/lib/validation/project"

type ActionResult = { error: string } | { ok: true; id?: string }

function toRow(v: ProjectInput) {
  return {
    name: v.name,
    client_id: v.clientId,
    owner_id: v.ownerId ?? null,
    description: v.description || null,
    start_date: v.startDate || null,
    expected_end: v.expectedEnd || null,
    status: v.status,
    contract_value: Number(paiseToDb(paiseFromInput(v.contractValue ?? "0"))),
    one_time_value: Number(paiseToDb(paiseFromInput(v.oneTimeValue ?? "0"))),
    mrr: Number(paiseToDb(paiseFromInput(v.mrr ?? "0"))),
    payment_terms: v.paymentTerms || null,
    notes: v.notes || null,
  }
}

export async function createProject(input: ProjectInput): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "projects.manage")) {
    return { error: "You don't have permission to manage projects." }
  }
  const parsed = projectSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const supabase = await createClient()
  const code = await nextCode("PRJ", "projects")
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...toRow(parsed.data), code, created_by: user.id })
    .select("id")
    .single()
  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: "project.created",
    p_entity: "projects",
    p_entity_id: data.id,
    p_summary: `${user.fullName} created project ${parsed.data.name}`,
  })
  revalidatePath("/projects")
  return { ok: true, id: data.id as string }
}

export async function updateProject(
  id: string,
  input: ProjectInput
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "projects.manage")) {
    return { error: "You don't have permission to manage projects." }
  }
  const parsed = projectSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  if (parsed.data.status === "closed") {
    return { error: "Use the closure panel to close a project." }
  }
  const supabase = await createClient()
  const { error } = await supabase.from("projects").update(toRow(parsed.data)).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/projects")
  revalidatePath(`/projects/${id}`)
  return { ok: true, id }
}

export async function setProjectStatus(
  id: string,
  status: (typeof PROJECT_STATUSES)[number]
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "projects.manage")) {
    return { error: "You don't have permission to manage projects." }
  }
  if (status === "closed") {
    return { error: "Use Close Project, which validates closure requirements." }
  }
  const supabase = await createClient()
  const { data: old } = await supabase
    .from("projects")
    .select("status")
    .eq("id", id)
    .maybeSingle()
  const { error } = await supabase.from("projects").update({ status }).eq("id", id)
  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: "project.status_changed",
    p_entity: "projects",
    p_entity_id: id,
    p_summary: `${user.fullName} changed project status ${old?.status ?? "?"} → ${status}`,
  })
  revalidatePath("/projects")
  revalidatePath(`/projects/${id}`)
  return { ok: true, id }
}

/** Close a project — only if all closure requirements are satisfied (spec §20). */
export async function closeProject(
  id: string,
  closureNotes: string
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "projects.close")) {
    return { error: "You don't have permission to close projects." }
  }
  const supabase = await createClient()

  // Persist closure notes first so the requirement check can see them.
  if (closureNotes?.trim()) {
    await supabase
      .from("projects")
      .update({ closure_notes: closureNotes.trim() })
      .eq("id", id)
  }

  const blockers = await getClosureBlockers(id)
  if (blockers.length > 0) {
    return { error: `Cannot close: ${blockers.join("; ")}` }
  }

  const { error } = await supabase
    .from("projects")
    .update({ status: "closed" })
    .eq("id", id)
  if (error) {
    // DB trigger is the backstop; surface its message cleanly.
    const msg = error.message.includes("PROJECT_CLOSURE_BLOCKED")
      ? error.message.split("PROJECT_CLOSURE_BLOCKED:")[1]?.trim()
      : error.message
    return { error: `Cannot close: ${msg}` }
  }

  await supabase.rpc("write_audit", {
    p_action: "project.closed",
    p_entity: "projects",
    p_entity_id: id,
    p_summary: `${user.fullName} closed the project`,
  })
  revalidatePath("/projects")
  revalidatePath(`/projects/${id}`)
  return { ok: true, id }
}

export async function addMilestone(input: MilestoneInput): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "projects.manage")) {
    return { error: "You don't have permission." }
  }
  const parsed = milestoneSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const v = parsed.data
  const supabase = await createClient()
  const { error } = await supabase.from("project_milestones").insert({
    project_id: v.projectId,
    title: v.title,
    due_date: v.dueDate || null,
    amount: Number(paiseToDb(paiseFromInput(v.amount ?? "0"))),
  })
  if (error) return { error: error.message }
  revalidatePath(`/projects/${v.projectId}`)
  return { ok: true }
}

export async function toggleMilestone(
  milestoneId: string,
  projectId: string,
  done: boolean
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "projects.manage")) {
    return { error: "You don't have permission." }
  }
  const supabase = await createClient()
  const { error } = await supabase
    .from("project_milestones")
    .update({ is_done: done })
    .eq("id", milestoneId)
  if (error) return { error: error.message }
  revalidatePath(`/projects/${projectId}`)
  return { ok: true }
}

export async function addProjectDocument(
  projectId: string,
  clientId: string | null,
  docType: string,
  name: string,
  path: string,
  size: number,
  mime: string
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "documents.manage")) {
    return { error: "You don't have permission to upload documents." }
  }
  const supabase = await createClient()
  const { error } = await supabase.from("documents").insert({
    name,
    doc_type: docType as never,
    bucket: "documents",
    storage_path: path,
    size_bytes: size,
    mime_type: mime,
    project_id: projectId,
    client_id: clientId,
    uploaded_by: user.id,
  })
  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: "document.uploaded",
    p_entity: "projects",
    p_entity_id: projectId,
    p_summary: `${user.fullName} uploaded ${name} (${docType})`,
  })
  revalidatePath(`/projects/${projectId}`)
  return { ok: true }
}
