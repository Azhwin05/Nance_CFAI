import type { Metadata } from "next"
import { ComingSoon } from "@/components/shared/coming-soon"

export const metadata: Metadata = { title: "Expenses" }

export default function Page() {
  return (
    <ComingSoon title="Expenses" description="Submit, track and approve company expenses." phase="Phase 4" icon="TrendingDown" />
  )
}
