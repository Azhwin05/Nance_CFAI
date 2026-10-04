import type { Metadata } from "next"
import { requirePermission, getCurrentUser, userCan } from "@/lib/auth/session"
import {
  listRecurringExpenses,
  getRecurringFormData,
} from "@/lib/finance/recurring"
import { PageHeader } from "@/components/shared/page-header"
import { RecurringExpenseManager } from "@/components/finance/recurring-manager"

export const metadata: Metadata = { title: "Recurring Expenses" }

export default async function RecurringExpensesPage() {
  await requirePermission("expenses.view")
  const user = await getCurrentUser()
  const canManage = userCan(user, "recurring.manage")

  const [rows, formData] = await Promise.all([
    listRecurringExpenses(),
    getRecurringFormData(),
  ])

  return (
    <div>
      <PageHeader
        title="Recurring Expenses"
        description="Rent, subscriptions and contractors that repeat on a schedule."
      />
      <RecurringExpenseManager
        rows={rows}
        categories={formData.categories}
        canManage={canManage}
      />
    </div>
  )
}
