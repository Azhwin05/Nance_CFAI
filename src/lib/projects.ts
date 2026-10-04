import "server-only"
import { createClient } from "@/lib/supabase/server"

export type ProjectListRow = {
  id: string
  code: string | null
  name: string
  status: string
  contract_value: number
  mrr: number
  client: { company_name: string } | null
  owner: { full_name: string } | null
}

export async function listProjects(): Promise<ProjectListRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .select(
      `id, code, name, status, contract_value, mrr,
       client:clients(company_name),
       owner:profiles!projects_owner_id_fkey(full_name)`
    )
    .order("created_at", { ascending: false })
    .limit(500)
  if (error) throw error
  return (data ?? []) as unknown as ProjectListRow[]
}

export async function getProject(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .select(
      `*,
       client:clients(id, company_name),
       owner:profiles!projects_owner_id_fkey(full_name),
       milestones:project_milestones(*),
       documents(id, name, doc_type, storage_path, size_bytes, created_at,
         uploader:profiles!documents_uploaded_by_fkey(full_name))`
    )
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data as Record<string, unknown> | null
}

/** Server-side closure requirement check (mirrors the DB guard, spec §20). */
export async function getClosureBlockers(projectId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("project_closure_blockers", {
    p_project: projectId,
  })
  if (error) return ["Could not evaluate closure requirements"]
  return (data as string[] | null) ?? []
}

export async function getProjectFormData() {
  const supabase = await createClient()
  const [clients, members] = await Promise.all([
    supabase.from("clients").select("id, company_name").order("company_name"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name"),
  ])
  return { clients: clients.data ?? [], members: members.data ?? [] }
}
