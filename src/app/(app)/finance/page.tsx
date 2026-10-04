import type { Metadata } from "next"
import { ComingSoon } from "@/components/shared/coming-soon"

export const metadata: Metadata = { title: "Finance Overview" }

export default function Page() {
  return (
    <ComingSoon
      title="Finance Overview"
      description="Receivables, payables and cash flow at a glance."
      phase="Phase 6"
      icon="Wallet"
    />
  )
}
