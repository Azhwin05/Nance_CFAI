import type { Permission } from "@/lib/permissions/roles"

export type NavItem = {
  title: string
  href: string
  icon: string // lucide icon name
  permission?: Permission
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

/** Primary sidebar navigation (desktop/tablet). */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "",
    items: [{ title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" }],
  },
  {
    label: "Business",
    items: [
      { title: "Leads", href: "/leads", icon: "Target", permission: "leads.view" },
      { title: "Clients", href: "/clients", icon: "Building2", permission: "clients.view" },
      { title: "Projects", href: "/projects", icon: "FolderKanban", permission: "projects.view" },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Overview", href: "/finance", icon: "Wallet", permission: "finance.view" },
      { title: "Income", href: "/finance/income", icon: "TrendingUp", permission: "income.view" },
      { title: "Expenses", href: "/finance/expenses", icon: "TrendingDown", permission: "expenses.view" },
      { title: "Invoices", href: "/finance/invoices", icon: "FileText", permission: "invoices.view" },
      { title: "MRR", href: "/finance/mrr", icon: "Repeat", permission: "mrr.view" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { title: "Documents", href: "/documents", icon: "FolderOpen", permission: "documents.view" },
      { title: "Reports", href: "/reports", icon: "BarChart3", permission: "reports.view" },
      { title: "Notifications", href: "/notifications", icon: "Bell" },
      { title: "Audit Logs", href: "/audit-logs", icon: "ScrollText", permission: "audit.view" },
      { title: "Settings", href: "/settings", icon: "Settings" },
    ],
  },
]

/** Mobile bottom navigation — kept to 5 items (spec §7). */
export const MOBILE_NAV: NavItem[] = [
  { title: "Home", href: "/dashboard", icon: "LayoutDashboard" },
  { title: "Clients", href: "/clients", icon: "Building2", permission: "clients.view" },
  { title: "Projects", href: "/projects", icon: "FolderKanban", permission: "projects.view" },
  { title: "Finance", href: "/finance", icon: "Wallet", permission: "finance.view" },
  { title: "More", href: "/more", icon: "Menu" },
]

/** Items shown on the mobile "More" screen. */
export const MORE_NAV: NavItem[] = [
  { title: "Leads", href: "/leads", icon: "Target", permission: "leads.view" },
  { title: "Income", href: "/finance/income", icon: "TrendingUp", permission: "income.view" },
  { title: "Expenses", href: "/finance/expenses", icon: "TrendingDown", permission: "expenses.view" },
  { title: "Invoices", href: "/finance/invoices", icon: "FileText", permission: "invoices.view" },
  { title: "MRR", href: "/finance/mrr", icon: "Repeat", permission: "mrr.view" },
  { title: "Documents", href: "/documents", icon: "FolderOpen", permission: "documents.view" },
  { title: "Reports", href: "/reports", icon: "BarChart3", permission: "reports.view" },
  { title: "Notifications", href: "/notifications", icon: "Bell" },
  { title: "Audit Logs", href: "/audit-logs", icon: "ScrollText", permission: "audit.view" },
  { title: "Settings", href: "/settings", icon: "Settings" },
]
