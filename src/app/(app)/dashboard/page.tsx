import type { Metadata } from "next"
import Link from "next/link"
import { getCurrentUser, userCan } from "@/lib/auth/session"
import { getDashboardSummary } from "@/lib/finance/summary"
import { getAnalytics, getAlerts } from "@/lib/finance/analytics"
import { formatMoney } from "@/lib/finance/money"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icon } from "@/components/shared/icon"
import { cn } from "@/lib/utils"
import {
  RevenueExpensesChart,
  ExpenseBreakdownChart,
  MrrTrendChart,
} from "@/components/charts/finance-charts"

export const metadata: Metadata = { title: "Dashboard" }

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

const ALERT_TONE: Record<string, string> = {
  danger: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  success: "text-emerald-600 dark:text-emerald-400",
  info: "text-blue-600 dark:text-blue-400",
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const canFinance = userCan(user, "finance.view")
  const [summary, analytics, alerts] = canFinance
    ? await Promise.all([getDashboardSummary(), getAnalytics(6), getAlerts()])
    : [null, null, null]

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

      {canFinance && summary && analytics && alerts ? (
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

          {/* Alerts (spec §12) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Action items</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You&apos;re all caught up.
                </p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {alerts.map((a, i) => (
                    <li key={i}>
                      <Link
                        href={a.href ?? "#"}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        <Icon
                          name={a.icon}
                          className={cn("size-4 shrink-0", ALERT_TONE[a.tone])}
                        />
                        <span>{a.message}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Revenue vs Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueExpensesChart data={analytics.revenueExpenses} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseBreakdownChart data={analytics.expenseBreakdown} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">MRR Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <MrrTrendChart data={analytics.mrrTrend} />
            </CardContent>
          </Card>
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
