import type { Metadata } from "next"
import { ComingSoon } from "@/components/shared/coming-soon"

export const metadata: Metadata = { title: "Income" }

export default function Page() {
  return (
    <ComingSoon
      title="Income"
      description="Money received, by client and project."
      phase="Phase 4"
      icon="TrendingUp"
    />
  )
}
