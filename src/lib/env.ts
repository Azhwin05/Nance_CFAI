/**
 * Centralized, validated environment access.
 * Fails fast at startup if required public vars are missing.
 */
import { z } from "zod"

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_NAME: z.string().default("Nance"),
})

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
})

// Note: Next.js inlines NEXT_PUBLIC_* at build time, so they must be referenced
// statically (not via a dynamic key) for client bundles.
const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
}

function parsePublic() {
  const parsed = publicSchema.safeParse(publicEnv)
  if (!parsed.success) {
    // Provide a readable error early rather than a cryptic runtime crash.
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n")
    throw new Error(
      `Invalid or missing public environment variables:\n${issues}\n` +
        `Copy .env.example to .env.local and fill in your Supabase project values.`
    )
  }
  return parsed.data
}

export const env = parsePublic()

export function getServerEnv() {
  return serverSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })
}
