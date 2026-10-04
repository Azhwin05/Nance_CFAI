import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { cookies } from "next/headers"
import { env, getServerEnv } from "@/lib/env"

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Reads/writes the auth session via Next.js cookies. Respects RLS as the
 * signed-in user.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component where cookies can't be set.
            // The middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    }
  )
}

/**
 * Service-role client that BYPASSES RLS. Use ONLY in trusted server code for
 * admin/seed operations after you have performed your own authorization check.
 * Never import this into client code.
 */
export function createAdminClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv()
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured")
  }
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: { getAll: () => [], setAll: () => {} },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
}
