/** Icon per notification type. Pure — safe on client and server. */
export const NOTIFICATION_ICONS: Record<string, string> = {
  expense_submitted: "TrendingDown",
  expense_approved: "CheckCircle2",
  expense_rejected: "X",
  expense_changes_requested: "Pencil",
  invoice_overdue: "AlertTriangle",
  payment_received: "Banknote",
  agreement_uploaded: "FileText",
  project_closure_ready: "CheckCircle2",
  project_closure_blocked: "AlertTriangle",
  recurring_expense_due: "CalendarClock",
  lead_converted: "Target",
  generic: "Bell",
}
