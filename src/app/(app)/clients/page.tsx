import type { Metadata } from "next"
import { ComingSoon } from "@/components/shared/coming-soon"

export const metadata: Metadata = { title: "Clients" }

export default function Page() {
  return (
    <ComingSoon title="Clients" description="Companies you work with and their contacts." phase="Phase 2" icon="Building2" />
  )
}
