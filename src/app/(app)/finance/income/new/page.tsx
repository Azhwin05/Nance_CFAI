import type { Metadata } from "next"
import { requirePermission } from "@/lib/auth/session"
import { getIncomeFormData } from "@/lib/finance/income"
import { PageHeader } from "@/components/shared/page-header"
import { IncomeForm } from "@/components/finance/income-form"

export const metadata: Metadata = { title: "Add Income" }

export default async function NewIncomePage() {
  await requirePermission("income.manage")
  const { clients, projects, methods } = await getIncomeFormData()

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add Income" description="Record money received." />
      <IncomeForm clients={clients} projects={projects} methods={methods} />
    </div>
  )
}
