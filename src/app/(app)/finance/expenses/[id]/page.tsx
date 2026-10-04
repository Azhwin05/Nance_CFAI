import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { requirePermission, getCurrentUser, userCan } from "@/lib/auth/session"
import { getExpense } from "@/lib/finance/expenses"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/status-badge"
import { EXPENSE_STATUS } from "@/lib/status"
import { formatMoney, paiseFromDb } from "@/lib/finance/money"
import { ExpenseApproval } from "@/components/finance/expense-approval"
import { buttonVariants } from "@/components/ui/button"
import { Icon } from "@/components/shared/icon"

export const metadata: Metadata = { title: "Expense" }

function fmtDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  )
}

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission("expenses.view")
  const { id } = await params
  const user = await getCurrentUser()
  const expense = await getExpense(id)
  if (!expense) notFound()

  const e = expense as Record<string, any>
  const amountPaise = paiseFromDb(e.amount)
  const canApprove =
    userCan(user, "expenses.approve") &&
    ["pending_approval", "changes_requested"].includes(e.status)

  // Signed URL for private proof
  let proofUrl: string | null = null
  if (e.proof?.storage_path) {
    const supabase = await createClient()
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(e.proof.storage_path, 300)
    proofUrl = data?.signedUrl ?? null
  }

  const approvals = (e.approvals ?? []) as Array<Record<string, any>>

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/finance/expenses"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to expenses
      </Link>

      <PageHeader
        title={e.vendor ?? "Expense"}
        description={e.code ?? undefined}
        actions={<StatusBadge map={EXPENSE_STATUS} value={e.status} />}
      />

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 text-3xl font-semibold tabular-nums">
            {formatMoney(amountPaise)}
          </div>
          <div className="divide-y">
            <Row label="Category">{e.category?.name ?? "Uncategorized"}</Row>
            <Row label="Date">{fmtDate(e.txn_date)}</Row>
            <Row label="Payment method">{e.payment_method?.name ?? "—"}</Row>
            <Row label="Project">{e.project?.name ?? "Company-wide"}</Row>
            <Row label="Recurring">{e.is_recurring ? "Yes" : "No"}</Row>
            <Row label="Submitted by">{e.submitter?.full_name ?? "—"}</Row>
            {e.approver?.full_name && (
              <Row label="Approved by">
                {e.approver.full_name} · {fmtDate(e.approved_at)}
              </Row>
            )}
            <Row label="Description">{e.description || "—"}</Row>
            <Row label="Proof">
              {proofUrl ? (
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {e.proof?.name ?? "View proof"}
                </a>
              ) : (
                "No proof attached"
              )}
            </Row>
          </div>
        </CardContent>
      </Card>

      {canApprove && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseApproval
              expenseId={e.id}
              summary={`${e.vendor ?? "Expense"} — ${formatMoney(amountPaise)}`}
            />
          </CardContent>
        </Card>
      )}

      {approvals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Approval history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvals
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              )
              .map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <Icon name="ScrollText" className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium capitalize">
                      {a.action.replace("_", " ")}
                      {a.actor?.full_name ? ` · ${a.actor.full_name}` : ""}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {fmtDate(a.created_at)}
                      {a.comment ? ` — ${a.comment}` : ""}
                    </div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {canApprove && (
        <p className="text-center text-xs text-muted-foreground">
          Need to add an expense instead?{" "}
          <Link href="/finance/expenses/new" className={buttonVariants({ variant: "link", size: "sm" })}>
            Add Expense
          </Link>
        </p>
      )}
    </div>
  )
}
