import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { NextResponse, type NextRequest } from "next/server"
import { env } from "@/lib/env"
import { isSupabaseConfigured } from "@/lib/supabase/config"

const PUBLIC_PATHS = ["/login", "/auth", "/offline"]

/**
 * Refreshes the Supabase auth session on every request and guards app routes.
 * Unauthenticated users hitting a protected route are redirected to /login.
 */
export async function updateSession(request: NextRequest) {
  const { pathname: earlyPath } = request.nextUrl

  // Backend not connected yet: run in PREVIEW MODE. Let every route render
  // (the app serves a demo Super Admin + sample data) so the UI is fully
  // navigable without a database. No real auth calls are made.
  if (!isSupabaseConfigured()) {
    void earlyPath
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirectedFrom", pathname)
    return NextResponse.redirect(url)
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
