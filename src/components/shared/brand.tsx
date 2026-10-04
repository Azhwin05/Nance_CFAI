import { cn } from "@/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold",
        className
      )}
      aria-hidden
    >
      N
    </div>
  )
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BrandMark />
      <div className="leading-tight">
        <div className="font-semibold tracking-tight">Nance</div>
      </div>
    </div>
  )
}
