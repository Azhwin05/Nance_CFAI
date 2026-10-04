import type { Metadata } from "next"
import { requirePermission } from "@/lib/auth/session"
import { getReportBundle } from "@/lib/reports"
import { PageHeader } from "@/components/shared/page-header"
import { ReportsView } from "@/components/reports/reports-view"

export const metadata: Metadata = { title: "Reports" }

export default async function ReportsPage() {
  await requirePermission("reports.view")
  const bundle = await getReportBundle(12)

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Revenue, expenses, profit, MRR, receivables and project profitability — filter, search and export."
      />
      <ReportsView bundle={bundle} />
    </div>
  )
}
