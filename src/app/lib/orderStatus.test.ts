import { describe, it, expect } from "vitest";
import { orderStatusLabel, orderStatusStyle } from "./orderStatus";

describe("orderStatusLabel", () => {
  it("maps known statuses to labels", () => {
    expect(orderStatusLabel("new")).toBe("Gözləyir");
    expect(orderStatusLabel("delivered")).toBe("Təslim edildi");
    expect(orderStatusLabel("cancelled")).toBe("Ləğv edildi");
  });

  it("falls back to the raw value for unknown statuses", () => {
    expect(orderStatusLabel("weird")).toBe("weird");
  });
});

describe("orderStatusStyle", () => {
  it("returns a class string for known statuses", () => {
    expect(orderStatusStyle("delivered")).toContain("green");
  });

  it("returns a neutral fallback for unknown statuses", () => {
    expect(orderStatusStyle("weird")).toContain("zinc");
  });
});
