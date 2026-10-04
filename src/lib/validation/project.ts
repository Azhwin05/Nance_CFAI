import { z } from "zod"

export const PROJECT_STATUSES = [
  "draft",
  "agreement_pending",
  "active",
  "on_hold",
  "completed",
  "closure_pending",
  "closed",
  "cancelled",
] as const

// Statuses a user can set directly from the form/status control.
// "closed" is intentionally excluded — closing goes through validation.
export const SETTABLE_STATUSES = PROJECT_STATUSES.filter(
  (s) => s !== "closed"
) as Exclude<(typeof PROJECT_STATUSES)[number], "closed">[]

const moneyOpt = z
  .string()
  .trim()
  .optional()
  .refine((v) => {
    if (!v) return true
    const n = Number(v.replace(/[,\s₹]/g, ""))
    return Number.isFinite(n) && n >= 0
  }, "Enter a valid amount")

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(200),
  clientId: z.string().uuid({ message: "Select a client" }),
  ownerId: z.string().uuid().optional().nullable(),
  description: z.string().trim().max(2000).optional(),
  startDate: z.string().optional().nullable(),
  expectedEnd: z.string().optional().nullable(),
  status: z.enum(PROJECT_STATUSES),
  contractValue: moneyOpt,
  oneTimeValue: moneyOpt,
  mrr: moneyOpt,
  paymentTerms: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
})

export type ProjectInput = z.infer<typeof projectSchema>

export const milestoneSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required").max(200),
  dueDate: z.string().optional().nullable(),
  amount: moneyOpt,
})
export type MilestoneInput = z.infer<typeof milestoneSchema>
