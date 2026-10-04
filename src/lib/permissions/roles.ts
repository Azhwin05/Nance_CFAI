/**
 * Role & permission model for Clickfield OS.
 *
 * This is the single source of truth used by the UI to show/hide actions.
 * It is MIRRORED (not replaced) by server-side checks and Postgres RLS.
 * Never rely on this file alone for authorization — it is a convenience layer.
 */

export const ROLES = [
  "super_admin",
  "admin",
  "finance",
  "project_manager",
  "employee",
  "viewer",
] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin / Management",
  finance: "Finance",
  project_manager: "Project Manager",
  employee: "Employee",
  viewer: "Viewer",
}

/** Relative rank — higher can generally see more. Used for coarse gating. */
export const ROLE_RANK: Record<Role, number> = {
  super_admin: 100,
  admin: 80,
  finance: 60,
  project_manager: 50,
  employee: 30,
  viewer: 10,
}

/**
 * Fine-grained permission flags. A role maps to a set of permissions.
 * Keep these stable — they are referenced by `can()` throughout the app.
 */
export const PERMISSIONS = [
  "users.manage",
  "settings.manage",
  "audit.view",
  "clients.view",
  "clients.manage",
  "leads.view",
  "leads.manage",
  "projects.view",
  "projects.manage",
  "projects.close",
  "documents.view",
  "documents.manage",
  "finance.view", // company-wide financials
  "income.view",
  "income.manage",
  "expenses.view",
  "expenses.submit",
  "expenses.approve",
  "invoices.view",
  "invoices.manage",
  "payments.view",
  "payments.manage",
  "mrr.view",
  "recurring.manage",
  "reports.view",
] as const

export type Permission = (typeof PERMISSIONS)[number]

const ALL: Permission[] = [...PERMISSIONS]

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ALL,
  admin: [
    "audit.view",
    "clients.view",
    "clients.manage",
    "leads.view",
    "leads.manage",
    "projects.view",
    "projects.manage",
    "projects.close",
    "documents.view",
    "documents.manage",
    "finance.view",
    "income.view",
    "income.manage",
    "expenses.view",
    "expenses.approve",
    "invoices.view",
    "invoices.manage",
    "payments.view",
    "payments.manage",
    "mrr.view",
    "recurring.manage",
    "reports.view",
  ],
  finance: [
    "clients.view",
    "projects.view",
    "documents.view",
    "documents.manage",
    "finance.view",
    "income.view",
    "income.manage",
    "expenses.view",
    "expenses.submit",
    "expenses.approve",
    "invoices.view",
    "invoices.manage",
    "payments.view",
    "payments.manage",
    "mrr.view",
    "recurring.manage",
    "reports.view",
  ],
  project_manager: [
    "clients.view",
    "clients.manage",
    "leads.view",
    "leads.manage",
    "projects.view",
    "projects.manage",
    "documents.view",
    "documents.manage",
    "expenses.view",
    "expenses.submit",
  ],
  employee: [
    "clients.view",
    "projects.view",
    "documents.view",
    "expenses.submit",
  ],
  viewer: [
    "clients.view",
    "projects.view",
    "documents.view",
    "reports.view",
  ],
}

export function roleHas(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/** Check if any of the given roles grants the permission. */
export function can(roles: Role[] | Role, permission: Permission): boolean {
  const list = Array.isArray(roles) ? roles : [roles]
  return list.some((r) => roleHas(r, permission))
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value)
}
