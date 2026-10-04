import { z } from "zod"

/** Create/submit an expense. Amount is entered in rupees (string) and
 *  converted to the DB numeric server-side. */
export const expenseCreateSchema = z.object({
  categoryId: z.string().uuid().optional().nullable(),
  vendor: z.string().trim().min(1, "Vendor is required").max(200),
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .refine((v) => {
      const n = Number(v.replace(/[,\s₹]/g, ""))
      return Number.isFinite(n) && n > 0
    }, "Enter a valid amount greater than 0"),
  txnDate: z.string().min(1, "Date is required"),
  paymentMethodId: z.string().uuid().optional().nullable(),
  description: z.string().trim().max(1000).optional(),
  projectId: z.string().uuid().optional().nullable(),
  isRecurring: z.boolean().optional(),
  // Optional proof document already uploaded to storage (path in documents bucket)
  proofPath: z.string().optional().nullable(),
  proofName: z.string().optional().nullable(),
  proofSize: z.number().optional().nullable(),
  proofMime: z.string().optional().nullable(),
})

export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>

export const expenseDecisionSchema = z.object({
  expenseId: z.string().uuid(),
  action: z.enum(["approved", "rejected", "changes_requested"]),
  comment: z.string().trim().max(1000).optional(),
})

export type ExpenseDecisionInput = z.infer<typeof expenseDecisionSchema>
