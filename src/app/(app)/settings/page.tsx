import type { Metadata } from "next"
import { requireUser, userCan } from "@/lib/auth/session"
import {
  getCompanySettings,
  listPaymentMethods,
  listExpenseCategories,
  listUsersWithRoles,
} from "@/lib/settings"
import { PageHeader } from "@/components/shared/page-header"
import { SettingsPanels } from "@/components/settings/settings-panels"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage() {
  const user = await requireUser()
  const canEditCompany =
    user.roles.includes("super_admin") || user.roles.includes("admin")
  const canManageFinance = userCan(user, "income.manage")

  const [company, methods, categories, users] = await Promise.all([
    getCompanySettings(),
    listPaymentMethods(),
    listExpenseCategories(),
    listUsersWithRoles(),
  ])

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Company profile, finance lookups, users and system preferences."
      />
      <SettingsPanels
        company={company}
        methods={methods}
        categories={categories}
        users={users}
        canEditCompany={canEditCompany}
        canManageFinance={canManageFinance}
      />
    </div>
  )
}
