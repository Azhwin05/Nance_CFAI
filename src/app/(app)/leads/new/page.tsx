import type { Metadata } from "next"
import { requirePermission } from "@/lib/auth/session"
import { getLeadOwners } from "@/lib/leads"
import { PageHeader } from "@/components/shared/page-header"
import { LeadForm } from "@/components/leads/lead-form"

export const metadata: Metadata = { title: "Add Lead" }

export default async function NewLeadPage() {
  await requirePermission("leads.manage")
  const owners = await getLeadOwners()
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add Lead" description="Create a new sales lead." />
      <LeadForm owners={owners} />
    </div>
  )
}
