import { z } from "zod"

export const INCOME_TYPES = [
  "one_time",
  "recurring",
  "advance",
  "milestone",
  "final_payment",
  "other",
] as const

export const incomeCreateSchema = z.object({
  clientId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .refine((v) => {
      const n = Number(v.replace(/[,\s₹]/g, ""))
      return Number.isFinite(n) && n > 0
    }, "Enter a valid amount greater than 0"),
  txnDate: z.string().min(1, "Date is required"),
  incomeType: z.enum(INCOME_TYPES),
  paymentMethodId: z.string().uuid().optional().nullable(),
  reference: z.string().trim().max(200).optional(),
  description: z.string().trim().max(1000).optional(),
})

export type IncomeCreateInput = z.infer<typeof incomeCreateSchema>

export const INCOME_TYPE_LABELS: Record<string, string> = {
  one_time: "One-time",
  recurring: "Recurring",
  advance: "Advance",
  milestone: "Milestone",
  final_payment: "Final payment",
  other: "Other",
}
