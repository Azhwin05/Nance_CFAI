import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Icon } from "@/components/shared/icon"

export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "default",
}: {
  label: string
  value: string
  icon?: string
  hint?: string
  tone?: "default" | "positive" | "negative" | "warning"
}) {
  const toneClass = {
    default: "text-foreground",
    positive: "text-emerald-600 dark:text-emerald-400",
    negative: "text-red-600 dark:text-red-400",
    warning: "text-amber-600 dark:text-amber-400",
  }[tone]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          {icon && <Icon name={icon} className="size-4 text-muted-foreground" />}
        </div>
        <div className={cn("mt-2 text-2xl font-semibold tabular-nums", toneClass)}>
          {value}
        </div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  )
}
