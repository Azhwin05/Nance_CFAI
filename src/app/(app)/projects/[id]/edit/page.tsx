import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requirePermission } from "@/lib/auth/session"
import { getProject, getProjectFormData } from "@/lib/projects"
import { PageHeader } from "@/components/shared/page-header"
import { ProjectForm } from "@/components/projects/project-form"
import type { ProjectInput } from "@/lib/validation/project"

export const metadata: Metadata = { title: "Edit Project" }

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission("projects.manage")
  const { id } = await params
  const [project, formData] = await Promise.all([
    getProject(id),
    getProjectFormData(),
  ])
  if (!project) notFound()
  const p = project as Record<string, any>

  const initial: Partial<ProjectInput> = {
    name: p.name ?? "",
    clientId: p.client_id ?? "",
    ownerId: p.owner_id ?? null,
    description: p.description ?? "",
    startDate: p.start_date ?? "",
    expectedEnd: p.expected_end ?? "",
    status: p.status,
    contractValue: p.contract_value != null ? String(p.contract_value) : "",
    oneTimeValue: p.one_time_value != null ? String(p.one_time_value) : "",
    mrr: p.mrr != null ? String(p.mrr) : "",
    paymentTerms: p.payment_terms ?? "",
    notes: p.notes ?? "",
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit Project" description={p.name} />
      <ProjectForm
        clients={formData.clients}
        members={formData.members}
        projectId={id}
        initial={initial}
      />
    </div>
  )
}
