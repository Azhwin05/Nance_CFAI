/**
 * Money handling for Clickfield OS.
 *
 * Rules:
 *  - The database stores amounts as NUMERIC(14,2). We represent money in the
 *    app as integer PAISE (1 INR = 100 paise) to avoid floating-point drift.
 *  - All arithmetic (sum, subtract, margin) happens on integers.
 *  - Convert to display strings only at the edges.
 *
 * Postgres returns NUMERIC as a string over the wire; parse it with
 * `paiseFromDb` rather than Number() to keep precision.
 */

export type Paise = number // integer

export const DEFAULT_CURRENCY = "INR"

/** Parse a DB NUMERIC string (e.g. "8500.00") into integer paise. */
export function paiseFromDb(value: string | number | null | undefined): Paise {
  if (value === null || value === undefined) return 0
  const str = typeof value === "number" ? value.toFixed(2) : value.trim()
  const neg = str.startsWith("-")
  const clean = neg ? str.slice(1) : str
  const [whole, frac = ""] = clean.split(".")
  const fracPadded = (frac + "00").slice(0, 2)
  const paise = Number(whole) * 100 + Number(fracPadded)
  return neg ? -paise : paise
}

/** Serialize integer paise back to a NUMERIC-compatible string "8500.00". */
export function paiseToDb(paise: Paise): string {
  const neg = paise < 0
  const abs = Math.abs(Math.round(paise))
  const whole = Math.floor(abs / 100)
  const frac = (abs % 100).toString().padStart(2, "0")
  return `${neg ? "-" : ""}${whole}.${frac}`
}

/** Parse user input like "8,500" or "8500.50" (rupees) into paise. */
export function paiseFromInput(input: string | number): Paise {
  if (typeof input === "number") return Math.round(input * 100)
  const clean = input.replace(/[,\s₹]/g, "").trim()
  if (clean === "" || clean === "-") return 0
  const rupees = Number(clean)
  if (!Number.isFinite(rupees)) return 0
  return Math.round(rupees * 100)
}

export const addPaise = (...values: Paise[]): Paise =>
  values.reduce((a, b) => a + b, 0)

export const subPaise = (a: Paise, b: Paise): Paise => a - b

/** Format paise as a localized currency string, e.g. "₹8,500.00". */
export function formatMoney(
  paise: Paise,
  currency: string = DEFAULT_CURRENCY,
  opts: { compact?: boolean; noDecimals?: boolean } = {}
): string {
  const amount = paise / 100
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    notation: opts.compact ? "compact" : "standard",
    minimumFractionDigits: opts.noDecimals ? 0 : 2,
    maximumFractionDigits: opts.noDecimals ? 0 : 2,
  }).format(amount)
}

/** Profit margin as a percentage (0–100, one decimal). Safe when revenue is 0. */
export function margin(revenue: Paise, expenses: Paise): number {
  if (revenue <= 0) return 0
  const profit = revenue - expenses
  return Math.round((profit / revenue) * 1000) / 10
}
