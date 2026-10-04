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
import { createLead, updateLead } from "@/app/(app)/leads/actions"
import { leadSchema, LEAD_STAGES, type LeadInput } from "@/lib/validation/lead"
import { LEAD_STAGE, statusEntry } from "@/lib/status"

const NONE = "__none__"
type Owner = { id: string; full_name: string }

export function LeadForm({
  owners,
  leadId,
  initial,
}: {
  owners: Owner[]
  leadId?: string
  initial?: Partial<LeadInput>
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const form = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      company: initial?.company ?? "",
      contactName: initial?.contactName ?? "",
      contactEmail: initial?.contactEmail ?? "",
      contactPhone: initial?.contactPhone ?? "",
      requirement: initial?.requirement ?? "",
      estimatedValue: initial?.estimatedValue ?? "",
      expectedMrr: initial?.expectedMrr ?? "",
      probability: initial?.probability ?? "",
      expectedClose: initial?.expectedClose ?? "",
      stage: initial?.stage ?? "lead",
      notes: initial?.notes ?? "",
      ownerId: initial?.ownerId ?? null,
    },
  })

  function onSubmit(values: LeadInput) {
    startTransition(async () => {
      const result = leadId
        ? await updateLead(leadId, values)
        : await createLead(values)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(leadId ? "Lead updated" : "Lead created")
      router.push(result.id && !leadId ? `/leads/${result.id}` : "/leads")
      router.refresh()
    })
  }

  const text = (
    name: keyof LeadInput,
    label: string,
    placeholder?: string,
    inputMode?: "decimal"
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              inputMode={inputMode}
              {...field}
              value={(field.value as string) ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {text("company", "Company", "Acme Corp")}
              {text("contactName", "Contact name")}
              {text("contactEmail", "Contact email")}
              {text("contactPhone", "Contact phone")}
              {text("estimatedValue", "Estimated value (₹)", "200000", "decimal")}
              {text("expectedMrr", "Expected MRR (₹)", "0", "decimal")}
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Probability (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        {...field}
                        value={(field.value as string) ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expectedClose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected close</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEAD_STAGES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {statusEntry(LEAD_STAGE, s).label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      {owners.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.full_name}
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
              name="requirement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirement</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} value={field.value ?? ""} />
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
                {pending ? "Saving…" : leadId ? "Save changes" : "Create lead"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
