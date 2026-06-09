import { describe, it, expect, beforeEach } from "vitest";
import {
  addToCart,
  getCartRows,
  getCartCount,
  toggleFavorite,
  getFavoriteIds,
  isFavorite,
  clearCart,
} from "./storage";

describe("cart storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds an item and reads it back", () => {
    addToCart(1, 2, "perfume-1");
    const rows = getCartRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(1);
    expect(rows[0].quantity).toBe(2);
    expect(getCartCount()).toBe(2);
  });

  it("merges quantity when the same default line is added twice", () => {
    addToCart(1, 1, "perfume-1");
    addToCart(1, 3, "perfume-1");
    const rows = getCartRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].quantity).toBe(4);
  });

  it("keeps distinct variants as separate lines", () => {
    const variant = (id: number) => ({
      id,
      label: `V${id}`,
      variantType: "premium",
      sizeMl: 50,
      price: 100,
      imageUrl: "",
    });
    addToCart(1, 1, "perfume-1", variant(10));
    addToCart(1, 1, "perfume-1", variant(11));
    expect(getCartRows()).toHaveLength(2);
  });

  it("clearCart empties the cart", () => {
    addToCart(1, 1, "perfume-1");
    clearCart();
    expect(getCartRows()).toHaveLength(0);
  });

  it("ignores malformed rows from storage", () => {
    localStorage.setItem(
      "cart-items",
      JSON.stringify([
        { id: 0, quantity: 1 },
        { id: 2, quantity: 1 },
      ])
    );
    const rows = getCartRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(2);
  });
});

describe("favorites storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("toggles a favorite on and off", () => {
    expect(isFavorite(5)).toBe(false);
    toggleFavorite(5);
    expect(getFavoriteIds()).toContain(5);
    expect(isFavorite(5)).toBe(true);
    toggleFavorite(5);
    expect(isFavorite(5)).toBe(false);
  });
});
