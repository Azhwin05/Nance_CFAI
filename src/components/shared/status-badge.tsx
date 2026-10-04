import { cn } from "@/lib/utils"
import { statusEntry, type Tone } from "@/lib/status"

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-muted text-foreground",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-700 dark:text-red-400",
  muted: "bg-muted text-muted-foreground",
}

export function StatusBadge({
  map,
  value,
  className,
}: {
  map: Record<string, { label: string; tone: Tone }>
  value: string
  className?: string
}) {
  const { label, tone } = statusEntry(map, value)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASS[tone],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT[tone])} />
      {label}
    </span>
  )
}

const DOT: Record<Tone, string> = {
  neutral: "bg-foreground/50",
  info: "bg-blue-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  muted: "bg-muted-foreground/50",
}
