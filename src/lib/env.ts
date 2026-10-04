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
  if (parsed.success) return parsed.data

  // Env isn't configured (e.g. a deploy without Supabase vars set yet). Rather
  // than hard-crash the whole build/runtime, fall back to placeholder values so
  // the app boots in preview mode — isSupabaseConfigured() returns false and
  // the UI shows its "connect Supabase" setup notice. Set the real
  // NEXT_PUBLIC_SUPABASE_* vars to enable live data.
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n")
  if (typeof console !== "undefined") {
    console.warn(
      `[Nance] Supabase env not configured — running in preview mode:\n${issues}`
    )
  }
  return {
    NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key",
    NEXT_PUBLIC_APP_NAME: publicEnv.NEXT_PUBLIC_APP_NAME || "Nance",
  }
}

export const env = parsePublic()

export function getServerEnv() {
  return serverSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })
}
