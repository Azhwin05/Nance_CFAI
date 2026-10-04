"use client"

import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/shared/icon"
import type { Role } from "@/lib/permissions/roles"
import { can } from "@/lib/permissions/roles"

type Action = { label: string; href: string; icon: string; permission?: string }

const ACTIONS: Action[] = [
  { label: "Add Expense", href: "/finance/expenses/new", icon: "TrendingDown", permission: "expenses.submit" },
  { label: "Add Income", href: "/finance/income/new", icon: "TrendingUp", permission: "income.manage" },
  { label: "Add Client", href: "/clients/new", icon: "Building2", permission: "clients.manage" },
  { label: "Add Project", href: "/projects/new", icon: "FolderKanban", permission: "projects.manage" },
  { label: "Upload Document", href: "/documents?upload=1", icon: "FolderOpen", permission: "documents.manage" },
]

export function QuickAddFab({ roles }: { roles: Role[] }) {
  const actions = ACTIONS.filter(
    (a) => !a.permission || can(roles, a.permission as never)
  )
  if (actions.length === 0) return null

  return (
    <div className="fixed bottom-20 right-4 z-40 lg:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Quick add"
          className={cn(
            buttonVariants({ size: "icon" }),
            "size-14 rounded-full shadow-lg"
          )}
        >
          <Icon name="Plus" className="size-6" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="mb-2 w-48">
          {actions.map((a) => (
            <DropdownMenuItem key={a.href} render={<Link href={a.href} />}>
              <Icon name={a.icon} className="size-4" />
              {a.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
