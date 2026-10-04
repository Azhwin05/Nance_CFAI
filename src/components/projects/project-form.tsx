"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { createProject, updateProject } from "@/app/(app)/projects/actions"
import {
  projectSchema,
  SETTABLE_STATUSES,
  type ProjectInput,
} from "@/lib/validation/project"
import { PROJECT_STATUS, statusEntry } from "@/lib/status"

const NONE = "__none__"
type Client = { id: string; company_name: string }
type Member = { id: string; full_name: string }

export function ProjectForm({
  clients,
  members,
  projectId,
  initial,
}: {
  clients: Client[]
  members: Member[]
  projectId?: string
  initial?: Partial<ProjectInput>
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: initial?.name ?? "",
      clientId: initial?.clientId ?? "",
      ownerId: initial?.ownerId ?? null,
      description: initial?.description ?? "",
      startDate: initial?.startDate ?? "",
      expectedEnd: initial?.expectedEnd ?? "",
      status: initial?.status ?? "draft",
      contractValue: initial?.contractValue ?? "",
      oneTimeValue: initial?.oneTimeValue ?? "",
      mrr: initial?.mrr ?? "",
      paymentTerms: initial?.paymentTerms ?? "",
      notes: initial?.notes ?? "",
    },
  })

  function onSubmit(values: ProjectInput) {
    startTransition(async () => {
      const result = projectId
        ? await updateProject(projectId, values)
        : await createProject(values)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(projectId ? "Project updated" : "Project created")
      router.push(result.id ? `/projects/${result.id}` : "/projects")
      router.refresh()
    })
  }

  // In edit mode the current status may be "closed"; include it so the select
  // shows a valid value, but the action blocks changing TO closed here.
  const statusOptions = Array.from(
    new Set<string>([...(initial?.status ? [initial.status] : []), ...SETTABLE_STATUSES])
  )

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project name</FormLabel>
                    <FormControl>
                      <Input placeholder="Hospital Website" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="ownerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>Unassigned</SelectItem>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s} value={s}>
                            {statusEntry(PROJECT_STATUS, s).label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="contractValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract value (₹)</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="oneTimeValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>One-time (₹)</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mrr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MRR (₹)</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expectedEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected completion</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment terms</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 50% advance, 50% on delivery" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : projectId ? "Save changes" : "Create project"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
