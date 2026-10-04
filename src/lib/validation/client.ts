import { z } from "zod"

export const CLIENT_STATUSES = [
  "lead",
  "prospect",
  "active",
  "inactive",
  "archived",
] as const

const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .optional()
  .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email")

export const clientSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  contactPerson: z.string().trim().max(200).optional(),
  email: optionalEmail,
  phone: z.string().trim().max(50).optional(),
  altPhone: z.string().trim().max(50).optional(),
  gstin: z.string().trim().max(50).optional(),
  address: z.string().trim().max(500).optional(),
  website: z.string().trim().max(200).optional(),
  industry: z.string().trim().max(100).optional(),
  status: z.enum(CLIENT_STATUSES),
  notes: z.string().trim().max(2000).optional(),
  assignedManager: z.string().uuid().optional().nullable(),
})

export type ClientInput = z.infer<typeof clientSchema>
