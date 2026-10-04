"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NAV_GROUPS, MOBILE_NAV } from "@/lib/nav"
import type { Role } from "@/lib/permissions/roles"
import { can } from "@/lib/permissions/roles"
import { Icon } from "@/components/shared/icon"
import { BrandWordmark } from "@/components/shared/brand"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { buttonVariants } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shell/theme-toggle"
import { UserMenu } from "@/components/shell/user-menu"
import { QuickAddFab } from "@/components/shell/quick-add-fab"
import type { CurrentUser } from "@/lib/auth/session"

function visible(roles: Role[], permission?: string) {
  if (!permission) return true
  return can(roles, permission as never)
}

function useActive(href: string) {
  const pathname = usePathname()
  if (href === "/dashboard") return pathname === "/dashboard"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function pageTitle(pathname: string): string {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (
        item.href === pathname ||
        (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))
      ) {
        return item.title
      }
    }
  }
  if (pathname.startsWith("/more")) return "More"
  return "Clickfield OS"
}

function NavLink({
  href,
  icon,
  title,
  onNavigate,
}: {
  href: string
  icon: string
  title: string
  onNavigate?: () => void
}) {
  const active = useActive(href)
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon name={icon} className="size-4 shrink-0" />
      <span className="truncate">{title}</span>
    </Link>
  )
}

function SidebarNav({
  roles,
  onNavigate,
}: {
  roles: Role[]
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-col gap-4 px-3 py-4">
      {NAV_GROUPS.map((group, gi) => {
        const items = group.items.filter((i) => visible(roles, i.permission))
        if (items.length === 0) return null
        return (
          <div key={gi} className="flex flex-col gap-1">
            {group.label && (
              <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </div>
            )}
            {items.map((item) => (
              <NavLink key={item.href} {...item} onNavigate={onNavigate} />
            ))}
          </div>
        )
      })}
    </nav>
  )
}

export function AppShell({
  user,
  children,
  preview = false,
}: {
  user: CurrentUser
  children: React.ReactNode
  preview?: boolean
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const roles = user.roles

  return (
    <div className="flex min-h-dvh w-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-14 items-center border-b px-5">
          <BrandWordmark />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav roles={roles} />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 pt-[env(safe-area-inset-top)]">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              aria-label="Menu"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "lg:hidden"
              )}
            >
              <Icon name="Menu" className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-14 items-center border-b px-5">
                <BrandWordmark />
              </div>
              <div className="overflow-y-auto">
                <SidebarNav roles={roles} onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <h1 className="truncate text-base font-semibold">{pageTitle(pathname)}</h1>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/notifications"
              aria-label="Notifications"
              className={buttonVariants({ variant: "ghost", size: "icon" })}
            >
              <Icon name="Bell" className="size-4" />
            </Link>
            <UserMenu user={user} />
          </div>
        </header>

        {preview && (
          <div className="border-b bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-700 dark:text-amber-400">
            Preview mode — demo data, no backend connected. Sign-in and saving
            are disabled until Supabase is set up.
          </div>
        )}

        <main className="flex-1 pb-24 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">{children}</div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden">
        {MOBILE_NAV.filter((i) => visible(roles, i.permission)).map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon name={item.icon} className="size-5" />
              {item.title}
            </Link>
          )
        })}
      </nav>

      <QuickAddFab roles={roles} />
    </div>
  )
}
