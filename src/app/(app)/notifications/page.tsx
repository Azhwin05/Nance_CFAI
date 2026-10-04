import type { Metadata } from "next"
import { ComingSoon } from "@/components/shared/coming-soon"

export const metadata: Metadata = { title: "Notifications" }

export default function Page() {
  return (
    <ComingSoon title="Notifications" description="Your in-app alerts." phase="Phase 6" icon="Bell" />
  )
}
