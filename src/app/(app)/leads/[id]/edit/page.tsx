import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requirePermission } from "@/lib/auth/session"
import { getLead, getLeadOwners } from "@/lib/leads"
import { PageHeader } from "@/components/shared/page-header"
import { LeadForm } from "@/components/leads/lead-form"
import type { LeadInput } from "@/lib/validation/lead"

export const metadata: Metadata = { title: "Edit Lead" }

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission("leads.manage")
  const { id } = await params
  const [lead, owners] = await Promise.all([getLead(id), getLeadOwners()])
  if (!lead) notFound()
  const l = lead as Record<string, any>

  const initial: Partial<LeadInput> = {
    company: l.company ?? "",
    contactName: l.contact_name ?? "",
    contactEmail: l.contact_email ?? "",
    contactPhone: l.contact_phone ?? "",
    requirement: l.requirement ?? "",
    estimatedValue: l.estimated_value ? String(l.estimated_value) : "",
    expectedMrr: l.expected_mrr ? String(l.expected_mrr) : "",
    probability: l.probability != null ? String(l.probability) : "",
    expectedClose: l.expected_close ?? "",
    stage: l.stage,
    notes: l.notes ?? "",
    ownerId: l.owner_id ?? null,
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit Lead" description={l.company} />
      <LeadForm owners={owners} leadId={id} initial={initial} />
    </div>
  )
}
