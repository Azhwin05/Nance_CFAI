import { z } from "zod"

const amount = z
  .string()
  .trim()
  .min(1, "Amount is required")
  .refine((v) => {
    const n = Number(v.replace(/[,\s₹]/g, ""))
    return Number.isFinite(n) && n > 0
  }, "Enter a valid amount greater than 0")

const frequency = z.enum(["weekly", "monthly", "quarterly", "yearly"])

/** Recurring revenue (MRR) — a repeating income commitment for a client. */
export const recurringRevenueSchema = z.object({
  clientId: z.string().uuid("Select a client"),
  projectId: z.string().uuid().optional().nullable(),
  name: z.string().trim().max(200).optional(),
  amount,
  frequency,
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  nextBilling: z.string().optional().nullable(),
})

export type RecurringRevenueInput = z.infer<typeof recurringRevenueSchema>

/** Recurring expense — a repeating cost (rent, subscriptions, contractors). */
export const recurringExpenseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  vendor: z.string().trim().max(200).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  amount,
  frequency,
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  nextDue: z.string().min(1, "Next due date is required"),
  autoCreate: z.boolean().optional(),
  requireApproval: z.boolean().optional(),
})

export type RecurringExpenseInput = z.infer<typeof recurringExpenseSchema>
