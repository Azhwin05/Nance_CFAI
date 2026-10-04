import type { Metadata } from "next"
import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { SetupNotice } from "@/components/shared/setup-notice"

export const metadata: Metadata = { title: "Sign in" }

export default function LoginPage() {
  if (!isSupabaseConfigured()) {
    return <SetupNotice />
  }
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
