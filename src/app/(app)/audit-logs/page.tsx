import type { Metadata } from "next"
import { requirePermission } from "@/lib/auth/session"
import { listAuditLogs } from "@/lib/audit"
import { PageHeader } from "@/components/shared/page-header"
import { AuditViewer } from "@/components/audit/audit-viewer"

export const metadata: Metadata = { title: "Audit Logs" }

export default async function AuditLogsPage() {
  await requirePermission("audit.view")
  const rows = await listAuditLogs()

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="An immutable trail of important actions — who did what, and when."
      />
      <AuditViewer rows={rows} />
    </div>
  )
}
