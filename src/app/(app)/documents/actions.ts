"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/session"
import { can } from "@/lib/permissions/roles"

type ActionResult = { error: string } | { ok: true }

export async function createDocument(input: {
  name: string
  docType: string
  path: string
  size: number
  mime: string
  clientId: string | null
  projectId: string | null
}): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "documents.manage")) {
    return { error: "You don't have permission to upload documents." }
  }
  if (!input.name.trim()) return { error: "A document name is required." }

  const supabase = await createClient()
  const { error } = await supabase.from("documents").insert({
    name: input.name.trim(),
    doc_type: input.docType as never,
    bucket: "documents",
    storage_path: input.path,
    size_bytes: input.size,
    mime_type: input.mime || null,
    client_id: input.clientId,
    project_id: input.projectId,
    uploaded_by: user.id,
  })
  if (error) return { error: error.message }

  await supabase.rpc("write_audit", {
    p_action: "document.uploaded",
    p_entity: "documents",
    p_entity_id: null as unknown as string,
    p_summary: `${user.fullName} uploaded ${input.name} (${input.docType})`,
  })

  revalidatePath("/documents")
  return { ok: true }
}

export async function deleteDocument(
  id: string,
  storagePath: string
): Promise<ActionResult> {
  const user = await requireUser()
  if (!can(user.roles, "documents.manage")) {
    return { error: "You don't have permission to delete documents." }
  }
  const supabase = await createClient()
  const { error } = await supabase.from("documents").delete().eq("id", id)
  if (error) return { error: error.message }
  // Best-effort removal of the stored object.
  await supabase.storage.from("documents").remove([storagePath])

  await supabase.rpc("write_audit", {
    p_action: "document.deleted",
    p_entity: "documents",
    p_entity_id: id,
    p_summary: `${user.fullName} deleted a document`,
  })

  revalidatePath("/documents")
  return { ok: true }
}

/** Mint a short-lived signed URL so private files are never guessable. */
export async function getDocumentUrl(
  storagePath: string
): Promise<{ url: string } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(storagePath, 300)
  if (error || !data) return { error: error?.message ?? "Couldn't open the file." }
  return { url: data.signedUrl }
}
