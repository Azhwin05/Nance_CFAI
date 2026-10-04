/** Document type labels + upload choices. Pure — safe on client and server. */
export const DOC_TYPE_LABELS: Record<string, string> = {
  agreement: "Agreement",
  quotation: "Quotation",
  invoice: "Invoice",
  purchase_order: "Purchase Order",
  client_approval: "Client Approval",
  final_acceptance: "Final Acceptance",
  client_document: "Client Document",
  project_document: "Project Document",
  payment_proof: "Payment Proof",
  expense_proof: "Expense Proof",
  other: "Other",
}

/** Upload-selectable types (proofs are created by their own flows). */
export const UPLOAD_DOC_TYPES = [
  "agreement",
  "quotation",
  "invoice",
  "purchase_order",
  "client_approval",
  "final_acceptance",
  "client_document",
  "project_document",
  "other",
] as const
