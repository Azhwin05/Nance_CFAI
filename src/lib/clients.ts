import "server-only"
import { createClient } from "@/lib/supabase/server"

export type ClientListRow = {
  id: string
  code: string | null
  company_name: string
  contact_person: string | null
  industry: string | null
  status: string
  manager: { full_name: string } | null
}

export async function listClients(): Promise<ClientListRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clients")
    .select(
      `id, code, company_name, contact_person, industry, status,
       manager:profiles!clients_assigned_manager_fkey(full_name)`
    )
    .order("company_name", { ascending: true })
    .limit(500)
  if (error) throw error
  return (data ?? []) as unknown as ClientListRow[]
}

export async function getClient(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clients")
    .select(
      `*, manager:profiles!clients_assigned_manager_fkey(full_name),
       contacts:client_contacts(*)`
    )
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data as Record<string, unknown> | null
}

export async function getClientProjects(clientId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select("id, code, name, status, contract_value, mrr")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
  return data ?? []
}

/** Profiles that can be assigned as managers (for the form dropdown). */
export async function getManagers() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("is_active", true)
    .order("full_name")
  return data ?? []
}
