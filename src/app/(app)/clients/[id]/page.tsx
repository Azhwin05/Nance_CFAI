import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { requirePermission, getCurrentUser, userCan } from "@/lib/auth/session"
import { getClient, getClientProjects } from "@/lib/clients"
import { getClientRollup } from "@/lib/finance/rollups"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { CLIENT_STATUS, PROJECT_STATUS } from "@/lib/status"
import { formatMoney, paiseFromDb } from "@/lib/finance/money"
import { buttonVariants } from "@/components/ui/button"
import { Icon } from "@/components/shared/icon"

export const metadata: Metadata = { title: "Client" }

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  )
}

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission("clients.view")
  const { id } = await params
  const user = await getCurrentUser()
  const client = await getClient(id)
  if (!client) notFound()

  const c = client as Record<string, any>
  const [rollup, projects] = await Promise.all([
    userCan(user, "finance.view") ? getClientRollup(id) : null,
    getClientProjects(id),
  ])
  const canManage = userCan(user, "clients.manage")

  return (
    <div className="space-y-4">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to clients
      </Link>

      <PageHeader
        title={c.company_name}
        description={c.code ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge map={CLIENT_STATUS} value={c.status} />
            {canManage && (
              <Link
                href={`/clients/${id}/edit`}
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
            label="Total Project Value"
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
            label="MRR"
            value={formatMoney(rollup.mrr, "INR", { noDecimals: true })}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              <Row label="Contact person">{c.contact_person ?? "—"}</Row>
              <Row label="Email">{c.email ?? "—"}</Row>
              <Row label="Phone">{c.phone ?? "—"}</Row>
              <Row label="Alt phone">{c.alt_phone ?? "—"}</Row>
              <Row label="Industry">{c.industry ?? "—"}</Row>
              <Row label="GSTIN">{c.gstin ?? "—"}</Row>
              <Row label="Website">{c.website ?? "—"}</Row>
              <Row label="Manager">{c.manager?.full_name ?? "—"}</Row>
              <Row label="Address">{c.address ?? "—"}</Row>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Projects</CardTitle>
            {userCan(user, "projects.manage") && (
              <Link
                href={`/projects/new?client=${id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Icon name="Plus" className="size-4" />
                New
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects yet.</p>
            ) : (
              <div className="divide-y">
                {projects.map((p: Record<string, any>) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between py-2 text-sm hover:text-primary"
                  >
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatMoney(paiseFromDb(p.contract_value), "INR", {
                          noDecimals: true,
                        })}
                      </div>
                    </div>
                    <StatusBadge map={PROJECT_STATUS} value={p.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {c.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">
            {c.notes}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
