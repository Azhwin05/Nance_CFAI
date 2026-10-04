import type { Metadata } from "next"
import { ComingSoon } from "@/components/shared/coming-soon"

export const metadata: Metadata = { title: "Projects" }

export default function Page() {
  return (
    <ComingSoon
      title="Projects"
      description="Client projects, milestones, documents and closure."
      phase="Phase 3"
      icon="FolderKanban"
    />
  )
}
