import type { Metadata } from "next"
import { ComingSoon } from "@/components/shared/coming-soon"

export const metadata: Metadata = { title: "MRR" }

export default function Page() {
  return (
    <ComingSoon
      title="MRR"
      description="Monthly recurring revenue by client."
      phase="Phase 5"
      icon="Repeat"
    />
  )
}
