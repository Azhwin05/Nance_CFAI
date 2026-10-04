import { z } from "zod"

export const LEAD_STAGES = [
  "lead",
  "discussion",
  "proposal_sent",
  "negotiation",
  "won",
  "agreement_pending",
  "active",
  "lost",
] as const

const moneyOpt = z
  .string()
  .trim()
  .optional()
  .refine((v) => {
    if (!v) return true
    const n = Number(v.replace(/[,\s₹]/g, ""))
    return Number.isFinite(n) && n >= 0
  }, "Enter a valid amount")

export const leadSchema = z.object({
  company: z.string().trim().min(1, "Company is required").max(200),
  contactName: z.string().trim().max(200).optional(),
  contactEmail: z.string().trim().max(200).optional(),
  contactPhone: z.string().trim().max(50).optional(),
  requirement: z.string().trim().max(2000).optional(),
  estimatedValue: moneyOpt,
  expectedMrr: moneyOpt,
  probability: z
    .string()
    .optional()
    .refine((v) => {
      if (!v) return true
      const n = Number(v)
      return Number.isInteger(n) && n >= 0 && n <= 100
    }, "Probability must be 0–100"),
  expectedClose: z.string().optional().nullable(),
  stage: z.enum(LEAD_STAGES),
  notes: z.string().trim().max(2000).optional(),
  ownerId: z.string().uuid().optional().nullable(),
})

export type LeadInput = z.infer<typeof leadSchema>
