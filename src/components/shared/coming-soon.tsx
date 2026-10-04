import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"

export function ComingSoon({
  title,
  description,
  phase,
  icon,
}: {
  title: string
  description?: string
  phase: string
  icon?: string
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title={`${title} is being built`}
        description={`This module comes online in ${phase}. The data model and security for it are already in place.`}
      />
    </div>
  )
}
