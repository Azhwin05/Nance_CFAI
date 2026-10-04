import type { Metadata } from "next"
import { ComingSoon } from "@/components/shared/coming-soon"

export const metadata: Metadata = { title: "Settings" }

export default function Page() {
  return (
    <ComingSoon
      title="Settings"
      description="Company, users, finance and security settings."
      phase="Phase 9"
      icon="Settings"
    />
  )
}
