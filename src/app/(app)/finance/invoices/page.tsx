import type { Metadata } from "next"
import { ComingSoon } from "@/components/shared/coming-soon"

export const metadata: Metadata = { title: "Invoices" }

export default function Page() {
  return (
    <ComingSoon
      title="Invoices"
      description="Issue and track invoices."
      phase="Phase 4"
      icon="FileText"
    />
  )
}
