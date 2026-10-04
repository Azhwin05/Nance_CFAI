"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Icon } from "@/components/shared/icon"
import { EmptyState } from "@/components/shared/empty-state"
import { createClient } from "@/lib/supabase/client"
import { DOC_TYPE_LABELS, UPLOAD_DOC_TYPES } from "@/lib/documents-meta"
import type { DocumentRow } from "@/lib/documents"
import {
  createDocument,
  deleteDocument,
  getDocumentUrl,
} from "@/app/(app)/documents/actions"

const NONE = "__none__"
const ALL = "all"

type Client = { id: string; company_name: string }
type Project = { id: string; name: string; client_id: string }

function fmtSize(bytes: number | null) {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function DocumentHub({
  rows,
  clients,
  projects,
  canManage,
}: {
  rows: DocumentRow[]
  clients: Client[]
  projects: Project[]
  canManage: boolean
}) {
  const router = useRouter()
  const [q, setQ] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState(ALL)
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const [busyId, setBusyId] = React.useState<string | null>(null)

  // upload form state
  const [name, setName] = React.useState("")
  const [docType, setDocType] = React.useState<string>("client_document")
  const [clientId, setClientId] = React.useState(NONE)
  const [projectId, setProjectId] = React.useState(NONE)
  const [file, setFile] = React.useState<File | null>(null)

  const projectsForClient = projects.filter(
    (p) => clientId === NONE || p.client_id === clientId
  )

  const filtered = rows.filter((r) => {
    if (typeFilter !== ALL && r.doc_type !== typeFilter) return false
    if (q) {
      const hay = `${r.name} ${r.client?.company_name ?? ""} ${r.project?.name ?? ""}`.toLowerCase()
      if (!hay.includes(q.toLowerCase())) return false
    }
    return true
  })

  function resetForm() {
    setName("")
    setDocType("client_document")
    setClientId(NONE)
    setProjectId(NONE)
    setFile(null)
  }

  function submit() {
    if (!file) {
      toast.error("Choose a file to upload.")
      return
    }
    startTransition(async () => {
      const supabase = createClient()
      const path = `library/${crypto.randomUUID()}-${file.name}`
      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(path, file, { upsert: false })
      if (upErr) {
        toast.error(`Upload failed: ${upErr.message}`)
        return
      }
      const result = await createDocument({
        name: name || file.name,
        docType,
        path,
        size: file.size,
        mime: file.type,
        clientId: clientId === NONE ? null : clientId,
        projectId: projectId === NONE ? null : projectId,
      })
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Document uploaded")
      setOpen(false)
      resetForm()
      router.refresh()
    })
  }

  function openDoc(path: string) {
    setBusyId(path)
    startTransition(async () => {
      const result = await getDocumentUrl(path)
      if ("error" in result) toast.error(result.error)
      else window.open(result.url, "_blank", "noopener,noreferrer")
      setBusyId(null)
    })
  }

  function remove(id: string, path: string) {
    if (!confirm("Delete this document? This cannot be undone.")) return
    setBusyId(id)
    startTransition(async () => {
      const result = await deleteDocument(id, path)
      if ("error" in result) toast.error(result.error)
      else {
        toast.success("Document deleted")
        router.refresh()
      }
      setBusyId(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Search documents…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? ALL)}>
          <SelectTrigger className="sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className={`${buttonVariants({ size: "sm" })} sm:ml-auto`}>
              <Icon name="Upload" className="size-4" />
              Upload
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload a document</DialogTitle>
                <DialogDescription>
                  Files are stored privately and only accessible through
                  short-lived signed links.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="doc-name">Name</Label>
                  <Input
                    id="doc-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Master Services Agreement"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={docType} onValueChange={(v) => setDocType(v ?? "other")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UPLOAD_DOC_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {DOC_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Client (optional)</Label>
                    <Select
                      value={clientId}
                      onValueChange={(v) => {
                        setClientId(v ?? NONE)
                        setProjectId(NONE)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>None</SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Project (optional)</Label>
                    <Select value={projectId} onValueChange={(v) => setProjectId(v ?? NONE)}>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>None</SelectItem>
                        {projectsForClient.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="doc-file">File</Label>
                  <Input
                    id="doc-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.csv"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                  Cancel
                </Button>
                <Button onClick={submit} disabled={pending || !file}>
                  {pending ? "Uploading…" : "Upload"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="FolderOpen"
          title="No documents"
          description="Agreements, quotations and other files appear here once uploaded."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Related</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {DOC_TYPE_LABELS[d.doc_type] ?? d.doc_type}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.project?.name ?? d.client?.company_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div>{fmtDate(d.created_at)}</div>
                      {d.uploader && (
                        <div className="text-xs">{d.uploader.full_name}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {fmtSize(d.size_bytes)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Open"
                          disabled={pending && busyId === d.storage_path}
                          onClick={() => openDoc(d.storage_path)}
                        >
                          <Icon name="Download" className="size-4" />
                        </Button>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete"
                            disabled={pending && busyId === d.id}
                            onClick={() => remove(d.id, d.storage_path)}
                          >
                            <Icon name="Trash2" className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-2 md:hidden">
            {filtered.map((d) => (
              <Card key={d.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{d.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {DOC_TYPE_LABELS[d.doc_type] ?? d.doc_type} ·{" "}
                      {d.project?.name ?? d.client?.company_name ?? "General"}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {fmtDate(d.created_at)} · {fmtSize(d.size_bytes)}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Open"
                      disabled={pending && busyId === d.storage_path}
                      onClick={() => openDoc(d.storage_path)}
                    >
                      <Icon name="Download" className="size-4" />
                    </Button>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        disabled={pending && busyId === d.id}
                        onClick={() => remove(d.id, d.storage_path)}
                      >
                        <Icon name="Trash2" className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
