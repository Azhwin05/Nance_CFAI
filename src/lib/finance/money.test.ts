import { describe, it, expect } from "vitest"
import {
  paiseFromDb,
  paiseToDb,
  paiseFromInput,
  addPaise,
  subPaise,
  formatMoney,
  margin,
} from "@/lib/finance/money"

describe("paiseFromDb", () => {
  it("parses NUMERIC strings without float drift", () => {
    expect(paiseFromDb("8500.00")).toBe(850000)
    expect(paiseFromDb("8500.50")).toBe(850050)
    expect(paiseFromDb("0.01")).toBe(1)
  })
  it("handles negatives and nullish", () => {
    expect(paiseFromDb("-1234.56")).toBe(-123456)
    expect(paiseFromDb(null)).toBe(0)
    expect(paiseFromDb(undefined)).toBe(0)
  })
  it("pads a single fractional digit", () => {
    expect(paiseFromDb("10.5")).toBe(1050)
  })
})

describe("paiseToDb <-> paiseFromDb round trip", () => {
  it("is lossless for representative values", () => {
    for (const p of [0, 1, 99, 100, 850050, -123456, 99999999]) {
      expect(paiseFromDb(paiseToDb(p))).toBe(p)
    }
  })
})

describe("paiseFromInput", () => {
  it("strips commas, spaces and rupee signs", () => {
    expect(paiseFromInput("8,500")).toBe(850000)
    expect(paiseFromInput("₹ 1,00,000")).toBe(10000000)
    expect(paiseFromInput("8500.50")).toBe(850050)
  })
  it("accepts numbers and bad input safely", () => {
    expect(paiseFromInput(42)).toBe(4200)
    expect(paiseFromInput("")).toBe(0)
    expect(paiseFromInput("abc")).toBe(0)
  })
})

describe("addPaise / subPaise", () => {
  it("sums and subtracts on integers", () => {
    expect(addPaise(100, 250, 50)).toBe(400)
    expect(addPaise()).toBe(0)
    expect(subPaise(500, 150)).toBe(350)
  })
})

describe("margin", () => {
  it("computes profit margin as a percentage", () => {
    expect(margin(100000, 40000)).toBe(60)
    expect(margin(100000, 125000)).toBe(-25)
  })
  it("is safe when revenue is zero", () => {
    expect(margin(0, 5000)).toBe(0)
  })
})

describe("formatMoney", () => {
  it("formats INR with no decimals when asked", () => {
    const s = formatMoney(850000, "INR", { noDecimals: true })
    expect(s).toContain("8,500")
    expect(s).not.toContain(".00")
  })
})
