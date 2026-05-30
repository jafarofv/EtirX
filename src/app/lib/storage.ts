import { getAuthToken } from "./auth";

const API_BASE = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000/api";

export type CartRow = { id: number; quantity: number; slug?: string };

async function syncJson(path: string, body: unknown, method: "POST" | "DELETE" = "POST") {
  const token = getAuthToken();
  if (!token) return;
  try {
    await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    // local storage remains the source of truth if offline/backend unavailable
  }
}

export async function syncStoredCollections() {
  try {
    const cart = getCartRows();
    const favorites = getFavoriteIds();
    await Promise.all([
      syncJson(
        "/me/cart/",
        {
          items: cart.map((row) => ({
            product_id: row.id,
            product_slug: row.slug,
            quantity: row.quantity,
          })),
        },
        "POST"
      ),
      syncJson("/me/favorites/", { items: favorites.map((id) => ({ product_id: id })) }, "POST"),
    ]);
  } catch {
    // ignore sync errors
  }
}

export function clearCart() {
  localStorage.removeItem("cart-items");
  window.dispatchEvent(new CustomEvent("app-storage-updated"));
  void syncJson("/me/cart/", {}, "DELETE");
}

export function getCartRows(): CartRow[] {
  try {
    const raw = localStorage.getItem("cart-items");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToCart(productId: number, quantity = 1, slug?: string) {
  const rows = getCartRows();
  const existing = rows.find((r) => r.id === productId);
  if (existing) {
    existing.quantity += quantity;
    if (slug && !existing.slug) existing.slug = slug;
  } else {
    rows.push({ id: productId, quantity, slug });
  }
  localStorage.setItem("cart-items", JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent("app-storage-updated"));
  void syncJson("/me/cart/", {
    items: rows.map((row) => ({ product_id: row.id, product_slug: row.slug, quantity: row.quantity })),
  }, "POST");
}

export function getFavoriteIds(): number[] {
  try {
    const raw = localStorage.getItem("favorites");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getFavoritesCount() {
  return getFavoriteIds().length;
}

export function getCartCount() {
  return getCartRows().reduce((sum, row) => sum + row.quantity, 0);
}

export function isFavorite(id: number) {
  return getFavoriteIds().includes(id);
}

export function toggleFavorite(id: number, slug?: string) {
  const ids = getFavoriteIds();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  localStorage.setItem("favorites", JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("app-storage-updated"));
  void syncJson("/me/favorites/", {
    items: next.map((itemId) => ({ product_id: itemId })),
  }, "POST");
  return next.includes(id);
}
