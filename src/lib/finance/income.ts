import "server-only"
import { createClient } from "@/lib/supabase/server"

export type IncomeListRow = {
  id: string
  code: string | null
  amount: number
  txn_date: string
  income_type: string
  reference: string | null
  description: string | null
  client: { company_name: string } | null
  project: { name: string } | null
  method: { name: string } | null
}

export async function listIncome(): Promise<IncomeListRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("income_transactions")
    .select(
      `id, code, amount, txn_date, income_type, reference, description,
       client:clients(company_name),
       project:projects(name),
       method:payment_methods(name)`
    )
    .eq("voided", false)
    .order("txn_date", { ascending: false })
    .limit(200)
  if (error) throw error
  return (data ?? []) as unknown as IncomeListRow[]
}

export async function getIncomeFormData() {
  const supabase = await createClient()
  const [clients, projects, methods] = await Promise.all([
    supabase
      .from("clients")
      .select("id, company_name")
      .order("company_name", { ascending: true }),
    supabase.from("projects").select("id, name, client_id").order("name"),
    supabase
      .from("payment_methods")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
  ])
  return {
    clients: clients.data ?? [],
    projects: projects.data ?? [],
    methods: methods.data ?? [],
  }
}
