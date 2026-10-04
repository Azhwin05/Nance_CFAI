import type { Metadata } from "next"
import { requirePermission } from "@/lib/auth/session"
import { getExpenseFormData } from "@/lib/finance/expenses"
import { PageHeader } from "@/components/shared/page-header"
import { ExpenseForm } from "@/components/finance/expense-form"

export const metadata: Metadata = { title: "Add Expense" }

type Project = { id: string; name: string; code: string | null }

export default async function NewExpensePage() {
  await requirePermission("expenses.submit")
  const { categories, methods, projects } = await getExpenseFormData()

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Add Expense"
        description="Submit an expense for approval."
      />
      <ExpenseForm
        categories={categories}
        methods={methods}
        projects={projects as unknown as Project[]}
      />
    </div>
  )
}
