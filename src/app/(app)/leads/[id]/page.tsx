import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { requirePermission, getCurrentUser, userCan } from "@/lib/auth/session"
import { getLead } from "@/lib/leads"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/status-badge"
import { LEAD_STAGE } from "@/lib/status"
import { formatMoney, paiseFromDb } from "@/lib/finance/money"
import { LeadActions } from "@/components/leads/lead-actions"
import { buttonVariants } from "@/components/ui/button"
import { Icon } from "@/components/shared/icon"

export const metadata: Metadata = { title: "Lead" }

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

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission("leads.view")
  const { id } = await params
  const user = await getCurrentUser()
  const lead = await getLead(id)
  if (!lead) notFound()

  const l = lead as Record<string, any>
  const canManage = userCan(user, "leads.manage")
  const activities = (l.activities ?? []) as Array<Record<string, any>>

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to pipeline
      </Link>

      <PageHeader
        title={l.company}
        description={l.code ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge map={LEAD_STAGE} value={l.stage} />
            {canManage && (
              <Link
                href={`/leads/${id}/edit`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Edit
              </Link>
            )}
          </div>
        }
      />

      {l.client?.id && (
        <Card>
          <CardContent className="flex items-center justify-between p-4 text-sm">
            <span className="text-muted-foreground">
              Converted to client{" "}
              <span className="font-medium text-foreground">
                {l.client.company_name}
              </span>
            </span>
            <Link
              href={`/clients/${l.client.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              View client
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                <Row label="Contact">{l.contact_name ?? "—"}</Row>
                <Row label="Email">{l.contact_email ?? "—"}</Row>
                <Row label="Phone">{l.contact_phone ?? "—"}</Row>
                <Row label="Estimated value">
                  {formatMoney(paiseFromDb(l.estimated_value), "INR", {
                    noDecimals: true,
                  })}
                </Row>
                <Row label="Expected MRR">
                  {formatMoney(paiseFromDb(l.expected_mrr), "INR", {
                    noDecimals: true,
                  })}
                </Row>
                <Row label="Probability">{l.probability}%</Row>
                <Row label="Expected close">{fmtDate(l.expected_close)}</Row>
                <Row label="Owner">{l.owner?.full_name ?? "—"}</Row>
                <Row label="Requirement">{l.requirement || "—"}</Row>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {activities
                    .sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    )
                    .map((a) => (
                      <div key={a.id} className="flex items-start gap-3 text-sm">
                        <Icon
                          name="ChevronRight"
                          className="mt-0.5 size-4 text-muted-foreground"
                        />
                        <div>
                          <div>{a.note}</div>
                          <div className="text-xs text-muted-foreground">
                            {fmtDate(a.created_at)}
                            {a.actor?.full_name ? ` · ${a.actor.full_name}` : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {canManage && (
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Manage</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadActions
                leadId={id}
                currentStage={l.stage}
                canConvert={userCan(user, "clients.manage") && l.stage === "won"}
                converted={!!l.converted_client_id}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
