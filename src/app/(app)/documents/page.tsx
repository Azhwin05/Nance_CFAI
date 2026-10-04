import type { Metadata } from "next"
import { ComingSoon } from "@/components/shared/coming-soon"

export const metadata: Metadata = { title: "Documents" }

export default function Page() {
  return (
    <ComingSoon
      title="Documents"
      description="Centralized, private document store."
      phase="Phase 3"
      icon="FolderOpen"
    />
  )
}
