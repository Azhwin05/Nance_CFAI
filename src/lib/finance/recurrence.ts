import type { Paise } from "@/lib/finance/money"

/**
 * Normalize an amount at any recurrence frequency to its monthly-equivalent
 * value (integer paise). Pure — safe to import on the client and in tests.
 */
export function monthlyEquivalent(amount: Paise, frequency: string): Paise {
  switch (frequency) {
    case "weekly":
      return Math.round((amount * 52) / 12)
    case "quarterly":
      return Math.round(amount / 3)
    case "yearly":
      return Math.round(amount / 12)
    default:
      return amount
  }
}
