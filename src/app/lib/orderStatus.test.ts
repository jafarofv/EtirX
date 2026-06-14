import { describe, it, expect } from "vitest";
import { orderStatusLabel, orderStatusStyle } from "./orderStatus";

describe("orderStatusLabel", () => {
  // Identity translator: returns the key, so we can assert the i18n key shape.
  const t = (key: string) => key;

  it("routes statuses through the i18n status.* keys", () => {
    expect(orderStatusLabel("new", t)).toBe("status.new");
    expect(orderStatusLabel("delivered", t)).toBe("status.delivered");
    expect(orderStatusLabel("cancelled", t)).toBe("status.cancelled");
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
