"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Icon } from "@/components/shared/icon"
import { createClient } from "@/lib/supabase/client"
import {
  setProjectStatus,
  addMilestone,
  toggleMilestone,
  closeProject,
  addProjectDocument,
} from "@/app/(app)/projects/actions"
import { SETTABLE_STATUSES } from "@/lib/validation/project"
import { PROJECT_STATUS, statusEntry } from "@/lib/status"
import { formatMoney, paiseFromDb } from "@/lib/finance/money"

const DOC_TYPES = [
  { value: "agreement", label: "Agreement" },
  { value: "quotation", label: "Quotation" },
  { value: "invoice", label: "Invoice" },
  { value: "purchase_order", label: "Purchase Order" },
  { value: "client_approval", label: "Client Approval" },
  { value: "final_acceptance", label: "Final Acceptance" },
  { value: "project_document", label: "Project Document" },
  { value: "other", label: "Other" },
]

type Milestone = {
  id: string
  title: string
  amount: number
  due_date: string | null
  is_done: boolean
}
type Doc = {
  id: string
  name: string
  doc_type: string
  url: string | null
  created_at: string
}

export function ProjectManage({
  projectId,
  clientId,
  status,
  milestones,
  documents,
  blockers,
  canManage,
  canClose,
}: {
  projectId: string
  clientId: string | null
  status: string
  milestones: Milestone[]
  documents: Doc[]
  blockers: string[]
  canManage: boolean
  canClose: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  // milestone add
  const [mTitle, setMTitle] = React.useState("")
  const [mAmount, setMAmount] = React.useState("")
  const [mDue, setMDue] = React.useState("")

  // document upload
  const [docType, setDocType] = React.useState("agreement")
  const [file, setFile] = React.useState<File | null>(null)
  const [uploading, setUploading] = React.useState(false)

  // closure
  const [closureNotes, setClosureNotes] = React.useState("")

  function changeStatus(next: string) {
    startTransition(async () => {
      const r = await setProjectStatus(projectId, next as never)
      if ("error" in r) {
        toast.error(r.error)
        return
      }
      toast.success("Status updated")
      router.refresh()
    })
  }

  function addM() {
    if (!mTitle.trim()) return
    startTransition(async () => {
      const r = await addMilestone({
        projectId,
        title: mTitle,
        amount: mAmount,
        dueDate: mDue || null,
      })
      if ("error" in r) {
        toast.error(r.error)
        return
      }
      setMTitle("")
      setMAmount("")
      setMDue("")
      toast.success("Milestone added")
      router.refresh()
    })
  }

  function toggleM(id: string, done: boolean) {
    startTransition(async () => {
      const r = await toggleMilestone(id, projectId, done)
      if ("error" in r) toast.error(r.error)
      router.refresh()
    })
  }

  async function upload() {
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const path = `project-docs/${projectId}/${crypto.randomUUID()}-${file.name}`
      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(path, file)
      if (upErr) {
        toast.error(`Upload failed: ${upErr.message}`)
        return
      }
      const r = await addProjectDocument(
        projectId,
        clientId,
        docType,
        file.name,
        path,
        file.size,
        file.type
      )
      if ("error" in r) {
        toast.error(r.error)
        return
      }
      setFile(null)
      toast.success("Document uploaded")
      router.refresh()
    } finally {
      setUploading(false)
    }
  }

  function close() {
    startTransition(async () => {
      const r = await closeProject(projectId, closureNotes)
      if ("error" in r) {
        toast.error(r.error)
        return
      }
      toast.success("Project closed")
      router.refresh()
    })
  }

  const statusOptions = Array.from(
    new Set<string>([status, ...SETTABLE_STATUSES])
  )

  return (
    <div className="space-y-4">
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={status} onValueChange={(v) => v && changeStatus(v)} disabled={pending}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s} disabled={s === "closed"}>
                    {statusEntry(PROJECT_STATUS, s).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Milestones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No milestones yet.</p>
          ) : (
            <div className="divide-y">
              {milestones
                .slice()
                .sort((a, b) => Number(a.is_done) - Number(b.is_done))
                .map((m) => (
                  <div key={m.id} className="flex items-center gap-3 py-2">
                    <Checkbox
                      checked={m.is_done}
                      disabled={!canManage || pending}
                      onCheckedChange={(v) => toggleM(m.id, !!v)}
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={
                          m.is_done
                            ? "text-sm line-through text-muted-foreground"
                            : "text-sm font-medium"
                        }
                      >
                        {m.title}
                      </div>
                      {(m.due_date || m.amount > 0) && (
                        <div className="text-xs text-muted-foreground">
                          {m.due_date ?? ""}
                          {m.amount > 0
                            ? ` · ${formatMoney(paiseFromDb(m.amount), "INR", { noDecimals: true })}`
                            : ""}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {canManage && (
            <div className="space-y-2 rounded-lg border p-3">
              <Input
                placeholder="Milestone title"
                value={mTitle}
                onChange={(e) => setMTitle(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Amount (₹)"
                  inputMode="decimal"
                  value={mAmount}
                  onChange={(e) => setMAmount(e.target.value)}
                />
                <Input
                  type="date"
                  value={mDue}
                  onChange={(e) => setMDue(e.target.value)}
                />
              </div>
              <Button size="sm" variant="outline" onClick={addM} disabled={pending || !mTitle.trim()}>
                <Icon name="Plus" className="size-4" />
                Add milestone
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents yet.</p>
          ) : (
            <div className="divide-y">
              {documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{d.name}</div>
                    <div className="text-xs capitalize text-muted-foreground">
                      {d.doc_type.replace("_", " ")}
                    </div>
                  </div>
                  {d.url && (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      View
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {canManage && (
            <div className="space-y-2 rounded-lg border p-3">
              <Label>Upload document</Label>
              <Select value={docType} onValueChange={(v) => v && setDocType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={upload}
                disabled={uploading || !file}
              >
                {uploading ? "Uploading…" : "Upload"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {canClose && status !== "closed" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Close project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {blockers.length > 0 ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                  <Icon name="ScrollText" className="size-4" />
                  Closure blocked
                </div>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {blockers.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                All closure requirements are satisfied.
              </p>
            )}
            <div className="grid gap-2">
              <Label htmlFor="closure-notes">Closure notes</Label>
              <Textarea
                id="closure-notes"
                value={closureNotes}
                onChange={(e) => setClosureNotes(e.target.value)}
                placeholder="Summary of final deliverables and payment status…"
                rows={3}
              />
            </div>
            <Button onClick={close} disabled={pending}>
              Close Project
            </Button>
            <p className="text-xs text-muted-foreground">
              Closing is validated on the server — any unmet requirement (e.g. a
              missing Agreement) will block it with a clear message.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
