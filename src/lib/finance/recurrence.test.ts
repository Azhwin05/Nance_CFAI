import { describe, it, expect } from "vitest"
import { monthlyEquivalent } from "@/lib/finance/recurrence"

describe("monthlyEquivalent", () => {
  it("leaves monthly amounts unchanged", () => {
    expect(monthlyEquivalent(2500000, "monthly")).toBe(2500000)
  })
  it("normalizes weekly to a monthly run-rate", () => {
    // 10000 paise/week * 52 / 12
    expect(monthlyEquivalent(10000, "weekly")).toBe(Math.round((10000 * 52) / 12))
  })
  it("divides quarterly by 3 and yearly by 12", () => {
    expect(monthlyEquivalent(300000, "quarterly")).toBe(100000)
    expect(monthlyEquivalent(1200000, "yearly")).toBe(100000)
  })
  it("defaults unknown frequencies to the raw amount", () => {
    expect(monthlyEquivalent(5000, "daily")).toBe(5000)
  })
})
