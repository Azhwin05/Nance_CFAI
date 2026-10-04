import type { Metadata } from "next"
import { ComingSoon } from "@/components/shared/coming-soon"

export const metadata: Metadata = { title: "Recurring Expenses" }

export default function Page() {
  return (
    <ComingSoon
      title="Recurring Expenses"
      description="Scheduled recurring costs."
      phase="Phase 5"
      icon="CalendarClock"
    />
  )
}
