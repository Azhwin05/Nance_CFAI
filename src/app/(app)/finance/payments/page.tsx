import type { Metadata } from "next"
import { ComingSoon } from "@/components/shared/coming-soon"

export const metadata: Metadata = { title: "Payments" }

export default function Page() {
  return (
    <ComingSoon
      title="Payments"
      description="Payments recorded against invoices."
      phase="Phase 4"
      icon="CreditCard"
    />
  )
}
