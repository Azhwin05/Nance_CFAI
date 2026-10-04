import "server-only"
import { createClient } from "@/lib/supabase/server"

export type AuditRow = {
  id: string
  action: string
  entity: string
  entity_id: string | null
  summary: string | null
  created_at: string
  actor: { full_name: string } | null
}

export async function listAuditLogs(limit = 300): Promise<AuditRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("audit_logs")
    .select(
      `id, action, entity, entity_id, summary, created_at,
       actor:profiles!audit_logs_actor_id_fkey(full_name)`
    )
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as unknown as AuditRow[]
}
