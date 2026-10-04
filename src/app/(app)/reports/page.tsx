import type { Metadata } from "next"
import { ComingSoon } from "@/components/shared/coming-soon"

export const metadata: Metadata = { title: "Reports" }

export default function Page() {
  return (
    <ComingSoon
      title="Reports"
      description="Revenue, expense, profit and MRR reports."
      phase="Phase 7"
      icon="BarChart3"
    />
  )
}
