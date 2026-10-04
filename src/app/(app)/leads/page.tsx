import type { Metadata } from "next"
import { ComingSoon } from "@/components/shared/coming-soon"

export const metadata: Metadata = { title: "Leads" }

export default function Page() {
  return (
    <ComingSoon
      title="Leads"
      description="Sales pipeline from first contact to won."
      phase="Phase 2"
      icon="Target"
    />
  )
}
