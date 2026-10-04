import { z } from "zod"

const money = z
  .string()
  .trim()
  .refine((v) => {
    if (v === "") return true
    const n = Number(v.replace(/[,\s₹]/g, ""))
    return Number.isFinite(n) && n >= 0
  }, "Enter a valid amount")

export const invoiceCreateSchema = z.object({
  clientId: z.string().uuid({ message: "Select a client" }),
  projectId: z.string().uuid().optional().nullable(),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().optional().nullable(),
  subtotal: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .refine((v) => {
      const n = Number(v.replace(/[,\s₹]/g, ""))
      return Number.isFinite(n) && n > 0
    }, "Enter a valid amount greater than 0"),
  tax: money.optional(),
  notes: z.string().trim().max(1000).optional(),
})

export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>

export const paymentRecordSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .refine((v) => {
      const n = Number(v.replace(/[,\s₹]/g, ""))
      return Number.isFinite(n) && n > 0
    }, "Enter a valid amount greater than 0"),
  paidOn: z.string().min(1, "Date is required"),
  paymentMethodId: z.string().uuid().optional().nullable(),
  reference: z.string().trim().max(200).optional(),
})

export type PaymentRecordInput = z.infer<typeof paymentRecordSchema>
