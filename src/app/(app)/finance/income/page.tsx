import type { Metadata } from "next"
import Link from "next/link"
import { requirePermission, getCurrentUser, userCan } from "@/lib/auth/session"
import { listIncome } from "@/lib/finance/income"
import { PageHeader } from "@/components/shared/page-header"
import { IncomeList } from "@/components/finance/income-list"
import { buttonVariants } from "@/components/ui/button"
import { Icon } from "@/components/shared/icon"

export const metadata: Metadata = { title: "Income" }

export default async function IncomePage() {
  await requirePermission("income.view")
  const user = await getCurrentUser()
  const rows = await listIncome()
  const canAdd = userCan(user, "income.manage")

  return (
    <div>
      <PageHeader
        title="Income"
        description="Money received, by client and project."
        actions={
          canAdd ? (
            <Link href="/finance/income/new" className={buttonVariants({ size: "sm" })}>
              <Icon name="Plus" className="size-4" />
              Add Income
            </Link>
          ) : null
        }
      />
      <IncomeList rows={rows} />
    </div>
  )
}
