import "server-only"
import { createClient } from "@/lib/supabase/server"

export type InvoiceListRow = {
  id: string
  number: string
  issue_date: string
  due_date: string | null
  total: number
  amount_paid: number
  status: string
  payment_status: string
  client: { company_name: string } | null
  project: { name: string } | null
}

export async function listInvoices(): Promise<InvoiceListRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("invoices")
    .select(
      `id, number, issue_date, due_date, total, amount_paid, status, payment_status,
       client:clients(company_name),
       project:projects(name)`
    )
    .order("issue_date", { ascending: false })
    .limit(200)
  if (error) throw error
  return (data ?? []) as unknown as InvoiceListRow[]
}

export async function getInvoice(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("invoices")
    .select(
      `*,
       client:clients(id, company_name),
       project:projects(id, name),
       payments(id, amount, paid_on, reference, voided,
         method:payment_methods(name))`
    )
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data as Record<string, unknown> | null
}

export async function getInvoiceFormData() {
  const supabase = await createClient()
  const [clients, projects, methods] = await Promise.all([
    supabase.from("clients").select("id, company_name").order("company_name"),
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

export async function listPayments() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payments")
    .select(
      `id, amount, paid_on, reference, voided,
       invoice:invoices(number),
       client:clients(company_name),
       method:payment_methods(name)`
    )
    .eq("voided", false)
    .order("paid_on", { ascending: false })
    .limit(200)
  if (error) throw error
  return (data ?? []) as unknown as Array<{
    id: string
    amount: number
    paid_on: string
    reference: string | null
    invoice: { number: string } | null
    client: { company_name: string } | null
    method: { name: string } | null
  }>
}
