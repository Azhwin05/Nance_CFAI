import type { Metadata } from "next"
import Link from "next/link"
import { requirePermission, getCurrentUser, userCan } from "@/lib/auth/session"
import { listProjects } from "@/lib/projects"
import { PageHeader } from "@/components/shared/page-header"
import { ProjectList } from "@/components/projects/project-list"
import { buttonVariants } from "@/components/ui/button"
import { Icon } from "@/components/shared/icon"

export const metadata: Metadata = { title: "Projects" }

export default async function ProjectsPage() {
  await requirePermission("projects.view")
  const user = await getCurrentUser()
  const rows = await listProjects()
  const canAdd = userCan(user, "projects.manage")

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Client projects, milestones, documents and closure."
        actions={
          canAdd ? (
            <Link href="/projects/new" className={buttonVariants({ size: "sm" })}>
              <Icon name="Plus" className="size-4" />
              Add Project
            </Link>
          ) : null
        }
      />
      <ProjectList rows={rows} />
    </div>
  )
}
