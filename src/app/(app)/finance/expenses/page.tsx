import type { Metadata } from "next"
import Link from "next/link"
import { requirePermission, getCurrentUser, userCan } from "@/lib/auth/session"
import { listExpenses } from "@/lib/finance/expenses"
import { PageHeader } from "@/components/shared/page-header"
import { ExpenseList } from "@/components/finance/expense-list"
import { buttonVariants } from "@/components/ui/button"
import { Icon } from "@/components/shared/icon"

export const metadata: Metadata = { title: "Expenses" }

export default async function ExpensesPage() {
  await requirePermission("expenses.view")
  const user = await getCurrentUser()
  const rows = await listExpenses()
  const canAdd = userCan(user, "expenses.submit")

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Submit, track and approve company expenses."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/finance/recurring"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Icon name="CalendarClock" className="size-4" />
              Recurring
            </Link>
            {canAdd && (
              <Link
                href="/finance/expenses/new"
                className={buttonVariants({ size: "sm" })}
              >
                <Icon name="Plus" className="size-4" />
                Add Expense
              </Link>
            )}
          </div>
        }
      />
      <ExpenseList rows={rows} />
    </div>
  )
}
