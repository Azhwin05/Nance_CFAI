"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type AuthResult = { error: string } | { ok: true }

export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  revalidatePath("/", "layout")
  return { ok: true }
}

export async function signUpWithPassword(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) return { error: error.message }
  revalidatePath("/", "layout")
  return { ok: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
