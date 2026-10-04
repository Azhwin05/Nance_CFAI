import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { requirePermission, getCurrentUser, userCan } from "@/lib/auth/session"
import { getProject, getClosureBlockers } from "@/lib/projects"
import { getProjectRollup } from "@/lib/finance/rollups"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { PROJECT_STATUS } from "@/lib/status"
import { formatMoney, margin } from "@/lib/finance/money"
import { ProjectManage } from "@/components/projects/project-manage"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = { title: "Project" }

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

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission("projects.view")
  const { id } = await params
  const user = await getCurrentUser()
  const project = await getProject(id)
  if (!project) notFound()

  const p = project as Record<string, any>
  const canManage = userCan(user, "projects.manage")
  const canClose = userCan(user, "projects.close")
  const canFinance = userCan(user, "finance.view")

  const [rollup, blockers] = await Promise.all([
    canFinance ? getProjectRollup(id) : null,
    canClose ? getClosureBlockers(id) : Promise.resolve<string[]>([]),
  ])

  // Signed URLs for documents
  const supabase = await createClient()
  const rawDocs = (p.documents ?? []) as Array<Record<string, any>>
  const documents = await Promise.all(
    rawDocs.map(async (d) => {
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(d.storage_path, 300)
      return {
        id: d.id,
        name: d.name,
        doc_type: d.doc_type,
        created_at: d.created_at,
        url: data?.signedUrl ?? null,
      }
    })
  )

  const milestones = (p.milestones ?? []) as Array<Record<string, any>>

  return (
    <div className="space-y-4">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to projects
      </Link>

      <PageHeader
        title={p.name}
        description={`${p.code ?? ""}${p.client?.company_name ? ` · ${p.client.company_name}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge map={PROJECT_STATUS} value={p.status} />
            {canManage && (
              <Link
                href={`/projects/${id}/edit`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Edit
              </Link>
            )}
          </div>
        }
      />

      {rollup && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Contract Value"
            value={formatMoney(rollup.contractValue, "INR", { noDecimals: true })}
          />
          <StatCard
            label="Received"
            value={formatMoney(rollup.received, "INR", { noDecimals: true })}
            tone="positive"
          />
          <StatCard
            label="Outstanding"
            value={formatMoney(rollup.outstanding, "INR", { noDecimals: true })}
            tone="warning"
          />
          <StatCard
            label="Expenses"
            value={formatMoney(rollup.expenses, "INR", { noDecimals: true })}
          />
          <StatCard
            label="Project Profit"
            value={formatMoney(rollup.profit, "INR", { noDecimals: true })}
            tone={rollup.profit >= 0 ? "positive" : "negative"}
            hint={`${margin(rollup.received, rollup.expenses)}% margin`}
          />
          <StatCard
            label="MRR"
            value={formatMoney(rollup.mrr, "INR", { noDecimals: true })}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                <Row label="Client">{p.client?.company_name ?? "—"}</Row>
                <Row label="Owner">{p.owner?.full_name ?? "—"}</Row>
                <Row label="Start date">{fmtDate(p.start_date)}</Row>
                <Row label="Expected completion">{fmtDate(p.expected_end)}</Row>
                <Row label="Payment terms">{p.payment_terms || "—"}</Row>
                <Row label="Description">{p.description || "—"}</Row>
                {p.closure_notes && (
                  <Row label="Closure notes">{p.closure_notes}</Row>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <ProjectManage
          projectId={id}
          clientId={p.client_id ?? null}
          status={p.status}
          milestones={milestones as never}
          documents={documents}
          blockers={blockers}
          canManage={canManage}
          canClose={canClose}
        />
      </div>
    </div>
  )
}
