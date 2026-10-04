import { env } from "@/lib/env"

/**
 * True when the app is still running on the placeholder Supabase values from
 * .env.local (i.e. no real backend connected yet). Used to show a friendly
 * setup screen instead of crashing on failed auth calls.
 */
export function isSupabaseConfigured(): boolean {
  return (
    !!env.NEXT_PUBLIC_SUPABASE_URL &&
    !env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") &&
    !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder")
  )
}
