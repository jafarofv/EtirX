import { describe, it, expect } from "vitest";
import { formatCurrency, CURRENCY_SYMBOL } from "./formatCurrency";

describe("formatCurrency", () => {
  it("formats with two decimals and the manat symbol", () => {
    expect(formatCurrency(100)).toBe(`100.00 ${CURRENCY_SYMBOL}`);
    expect(formatCurrency(9.5)).toBe(`9.50 ${CURRENCY_SYMBOL}`);
  });

  it("rounds to two decimal places", () => {
    expect(formatCurrency(10.005)).toBe(`10.01 ${CURRENCY_SYMBOL}`);
    expect(formatCurrency(0)).toBe(`0.00 ${CURRENCY_SYMBOL}`);
  });
});
