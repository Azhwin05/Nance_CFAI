import { cache } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import type { Permission, Role } from "@/lib/permissions/roles"
import { can as roleCan } from "@/lib/permissions/roles"

export type CurrentUser = {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  roles: Role[]
}

/** Demo identity used in preview mode (no backend connected). */
const DEMO_USER: CurrentUser = {
  id: "demo-super-admin",
  email: "demo@clickfield.ai",
  fullName: "Ashwin (Demo)",
  avatarUrl: null,
  roles: ["super_admin"],
}

/**
 * Resolve the signed-in user with profile + roles. Cached per request.
 * Returns null when not authenticated.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured()) return DEMO_USER
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ])

  const roles = ((roleRows as { role: Role }[] | null) ?? []).map((r) => r.role)

  return {
    id: user.id,
    email: (profile?.email as string) ?? user.email ?? "",
    fullName:
      (profile?.full_name as string) ||
      (user.email ? user.email.split("@")[0] : "User"),
    avatarUrl: (profile?.avatar_url as string | null) ?? null,
    roles,
  }
})

/** Require an authenticated user or redirect to login. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

/** Require a specific permission or redirect to the dashboard. */
export async function requirePermission(
  permission: Permission
): Promise<CurrentUser> {
  const user = await requireUser()
  if (!roleCan(user.roles, permission)) redirect("/dashboard")
  return user
}

export function userCan(user: CurrentUser | null, permission: Permission) {
  if (!user) return false
  return roleCan(user.roles, permission)
}
