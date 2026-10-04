import type { Metadata } from "next"
import { requirePermission, getCurrentUser, userCan } from "@/lib/auth/session"
import {
  listRecurringRevenues,
  getMrrSummary,
  getRecurringFormData,
} from "@/lib/finance/recurring"
import { PageHeader } from "@/components/shared/page-header"
import { MrrManager } from "@/components/finance/mrr-manager"

export const metadata: Metadata = { title: "MRR" }

export default async function MrrPage() {
  await requirePermission("mrr.view")
  const user = await getCurrentUser()
  const canManage = userCan(user, "recurring.manage")

  const [rows, summary, formData] = await Promise.all([
    listRecurringRevenues(),
    getMrrSummary(),
    getRecurringFormData(),
  ])

  return (
    <div>
      <PageHeader
        title="Monthly Recurring Revenue"
        description="Retainers and subscriptions, normalized to a monthly run-rate."
      />
      <MrrManager
        rows={rows}
        summary={summary}
        clients={formData.clients}
        projects={formData.projects}
        canManage={canManage}
      />
    </div>
  )
}
