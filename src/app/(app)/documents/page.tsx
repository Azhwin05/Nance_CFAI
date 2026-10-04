import type { Metadata } from "next"
import { requirePermission, getCurrentUser, userCan } from "@/lib/auth/session"
import { listDocuments, getDocumentFormData } from "@/lib/documents"
import { PageHeader } from "@/components/shared/page-header"
import { DocumentHub } from "@/components/documents/document-hub"

export const metadata: Metadata = { title: "Documents" }

export default async function DocumentsPage() {
  await requirePermission("documents.view")
  const user = await getCurrentUser()
  const canManage = userCan(user, "documents.manage")

  const [rows, formData] = await Promise.all([
    listDocuments(),
    getDocumentFormData(),
  ])

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Agreements, quotations, invoices and proofs — stored privately."
      />
      <DocumentHub
        rows={rows}
        clients={formData.clients}
        projects={formData.projects}
        canManage={canManage}
      />
    </div>
  )
}
