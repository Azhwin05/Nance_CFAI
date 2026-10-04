"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/shared/icon"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Icon name={isDark ? "Sun" : "Moon"} className="size-4" />
    </Button>
  )
}
