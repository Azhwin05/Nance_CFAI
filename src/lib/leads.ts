import "server-only"
import { createClient } from "@/lib/supabase/server"

export type LeadListRow = {
  id: string
  code: string | null
  company: string
  contact_name: string | null
  estimated_value: number
  expected_mrr: number
  probability: number
  stage: string
  expected_close: string | null
  owner: { full_name: string } | null
}

export async function listLeads(): Promise<LeadListRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("leads")
    .select(
      `id, code, company, contact_name, estimated_value, expected_mrr,
       probability, stage, expected_close,
       owner:profiles!leads_owner_id_fkey(full_name)`
    )
    .order("created_at", { ascending: false })
    .limit(500)
  if (error) throw error
  return (data ?? []) as unknown as LeadListRow[]
}

export async function getLead(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("leads")
    .select(
      `*, owner:profiles!leads_owner_id_fkey(full_name),
       client:clients!leads_converted_client_id_fkey(id, company_name),
       activities:lead_activities(id, note, created_at,
         actor:profiles!lead_activities_created_by_fkey(full_name))`
    )
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data as Record<string, unknown> | null
}

export async function getLeadOwners() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("is_active", true)
    .order("full_name")
  return data ?? []
}
