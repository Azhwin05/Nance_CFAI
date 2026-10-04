import type { Metadata } from "next"
import { requirePermission } from "@/lib/auth/session"
import { getProjectFormData } from "@/lib/projects"
import { PageHeader } from "@/components/shared/page-header"
import { ProjectForm } from "@/components/projects/project-form"
import type { ProjectInput } from "@/lib/validation/project"

export const metadata: Metadata = { title: "Add Project" }

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>
}) {
  await requirePermission("projects.manage")
  const { client } = await searchParams
  const { clients, members } = await getProjectFormData()
  const initial: Partial<ProjectInput> | undefined = client
    ? { clientId: client }
    : undefined

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add Project" description="Create a new project." />
      <ProjectForm clients={clients} members={members} initial={initial} />
    </div>
  )
}
