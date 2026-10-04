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
import {
  createClientRecord,
  updateClientRecord,
} from "@/app/(app)/clients/actions"
import {
  clientSchema,
  CLIENT_STATUSES,
  type ClientInput,
} from "@/lib/validation/client"
import { CLIENT_STATUS, statusEntry } from "@/lib/status"

const NONE = "__none__"
type Manager = { id: string; full_name: string }

export function ClientForm({
  managers,
  clientId,
  initial,
}: {
  managers: Manager[]
  clientId?: string
  initial?: Partial<ClientInput>
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const form = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      companyName: initial?.companyName ?? "",
      contactPerson: initial?.contactPerson ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      altPhone: initial?.altPhone ?? "",
      gstin: initial?.gstin ?? "",
      address: initial?.address ?? "",
      website: initial?.website ?? "",
      industry: initial?.industry ?? "",
      status: initial?.status ?? "active",
      notes: initial?.notes ?? "",
      assignedManager: initial?.assignedManager ?? null,
    },
  })

  function onSubmit(values: ClientInput) {
    startTransition(async () => {
      const result = clientId
        ? await updateClientRecord(clientId, values)
        : await createClientRecord(values)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(clientId ? "Client updated" : "Client created")
      router.push(result.id ? `/clients/${result.id}` : "/clients")
      router.refresh()
    })
  }

  const text = (name: keyof ClientInput, label: string, placeholder?: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
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
              {text("companyName", "Company name", "NK Hospital")}
              {text("contactPerson", "Contact person", "Dr. Nair")}
              {text("email", "Email", "contact@company.com")}
              {text("phone", "Phone", "+91 …")}
              {text("altPhone", "Alternate phone")}
              {text("industry", "Industry", "Healthcare")}
              {text("gstin", "GSTIN")}
              {text("website", "Website", "https://…")}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
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
                        {CLIENT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {statusEntry(CLIENT_STATUS, s).label}
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
                name="assignedManager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned manager</FormLabel>
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
                        {managers.map((m) => (
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
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} value={field.value ?? ""} />
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
                {pending
                  ? "Saving…"
                  : clientId
                    ? "Save changes"
                    : "Create client"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
