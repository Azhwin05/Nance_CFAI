/**
 * Central mapping of status values -> human labels + visual tone.
 * Used by StatusBadge everywhere so statuses look consistent app-wide.
 */
export type Tone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "muted"

type Entry = { label: string; tone: Tone }

export const EXPENSE_STATUS: Record<string, Entry> = {
  draft: { label: "Draft", tone: "muted" },
  pending_approval: { label: "Pending Approval", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  changes_requested: { label: "Changes Requested", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  void: { label: "Void", tone: "muted" },
}

export const INVOICE_STATUS: Record<string, Entry> = {
  draft: { label: "Draft", tone: "muted" },
  sent: { label: "Sent", tone: "info" },
  partially_paid: { label: "Partially Paid", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  overdue: { label: "Overdue", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "muted" },
}

export const PAYMENT_STATUS: Record<string, Entry> = {
  pending: { label: "Pending", tone: "warning" },
  partially_paid: { label: "Partially Paid", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  overdue: { label: "Overdue", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "muted" },
  refunded: { label: "Refunded", tone: "info" },
}

export const PROJECT_STATUS: Record<string, Entry> = {
  draft: { label: "Draft", tone: "muted" },
  agreement_pending: { label: "Agreement Pending", tone: "warning" },
  active: { label: "Active", tone: "success" },
  on_hold: { label: "On Hold", tone: "warning" },
  completed: { label: "Completed", tone: "info" },
  closure_pending: { label: "Closure Pending", tone: "warning" },
  closed: { label: "Closed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "muted" },
}

export const CLIENT_STATUS: Record<string, Entry> = {
  lead: { label: "Lead", tone: "info" },
  prospect: { label: "Prospect", tone: "info" },
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "muted" },
  archived: { label: "Archived", tone: "muted" },
}

export const LEAD_STAGE: Record<string, Entry> = {
  lead: { label: "Lead", tone: "neutral" },
  discussion: { label: "Discussion", tone: "info" },
  proposal_sent: { label: "Proposal Sent", tone: "info" },
  negotiation: { label: "Negotiation", tone: "warning" },
  won: { label: "Won", tone: "success" },
  agreement_pending: { label: "Agreement Pending", tone: "warning" },
  active: { label: "Active", tone: "success" },
  lost: { label: "Lost", tone: "danger" },
}

export function statusEntry(
  map: Record<string, Entry>,
  value: string
): Entry {
  return map[value] ?? { label: value, tone: "neutral" }
}
