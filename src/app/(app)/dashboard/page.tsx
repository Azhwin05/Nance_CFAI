import type { Metadata } from "next"
import { getCurrentUser, userCan } from "@/lib/auth/session"
import { getDashboardSummary } from "@/lib/finance/summary"
import { formatMoney } from "@/lib/finance/money"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = { title: "Dashboard" }

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const canFinance = userCan(user, "finance.view")
  const summary = canFinance ? await getDashboardSummary() : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {user?.fullName.split(" ")[0] ?? "there"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with Nance.
        </p>
      </div>

      {canFinance && summary ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Total Revenue"
              value={formatMoney(summary.totalRevenue, "INR", { noDecimals: true })}
              icon="TrendingUp"
              tone="positive"
            />
            <StatCard
              label="Total Expenses"
              value={formatMoney(summary.totalExpenses, "INR", { noDecimals: true })}
              icon="TrendingDown"
            />
            <StatCard
              label="Net Profit"
              value={formatMoney(summary.netProfit, "INR", { noDecimals: true })}
              icon="Wallet"
              tone={summary.netProfit >= 0 ? "positive" : "negative"}
            />
            <StatCard
              label="MRR"
              value={formatMoney(summary.mrr, "INR", { noDecimals: true })}
              icon="Repeat"
            />
            <StatCard
              label="Receivables"
              value={formatMoney(summary.receivables, "INR", { noDecimals: true })}
              icon="FileText"
              tone="warning"
            />
            <StatCard
              label="Upcoming Expenses"
              value={formatMoney(summary.upcomingExpenses, "INR", { noDecimals: true })}
              icon="CalendarClock"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Revenue vs Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Charts come online in Phase 6 and read from your real
                  transactions.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Action items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Alerts (overdue invoices, pending approvals, closure blocks) appear here.</p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            You don&apos;t have access to company-wide financials. Your assigned
            clients, projects and expenses are available from the navigation.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
