import "server-only"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"

export type DocumentRow = {
  id: string
  name: string
  doc_type: string
  storage_path: string
  mime_type: string | null
  size_bytes: number | null
  version: number
  created_at: string
  client: { id: string; company_name: string } | null
  project: { id: string; name: string } | null
  uploader: { full_name: string } | null
}

export { DOC_TYPE_LABELS, UPLOAD_DOC_TYPES } from "@/lib/documents-meta"

export async function listDocuments(): Promise<DocumentRow[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("documents")
    .select(
      `id, name, doc_type, storage_path, mime_type, size_bytes, version, created_at,
       client:clients(id, company_name),
       project:projects(id, name),
       uploader:profiles!documents_uploaded_by_fkey(full_name)`
    )
    .order("created_at", { ascending: false })
    .limit(500)
  if (error) throw error
  return (data ?? []) as unknown as DocumentRow[]
}

export async function getDocumentFormData() {
  if (!isSupabaseConfigured()) return { clients: [], projects: [] }
  const supabase = await createClient()
  const [clients, projects] = await Promise.all([
    supabase.from("clients").select("id, company_name").order("company_name"),
    supabase.from("projects").select("id, name, client_id").order("name"),
  ])
  return { clients: clients.data ?? [], projects: projects.data ?? [] }
}
