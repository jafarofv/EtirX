import { getAuthToken } from "./auth";
import { API_BASE } from "./config";

const COLLECTIONS_VERSION = "3";
const COLLECTIONS_VERSION_KEY = "collections-version";

export type CartRow = {
  id: number;
  quantity: number;
  slug?: string;
  variantId?: number;
  variantLabel?: string;
  variantType?: string;
  variantSizeMl?: number | null;
  variantPrice?: number;
  variantImage?: string;
};

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

function isValidCartRow(value: unknown): value is CartRow {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as CartRow).id === "number" &&
      typeof (value as CartRow).quantity === "number" &&
      (typeof (value as CartRow).slug === "string" || typeof (value as CartRow).slug === "undefined")
      && (typeof (value as CartRow).variantId === "number" || typeof (value as CartRow).variantId === "undefined")
  );
}

function migrateCollectionsIfNeeded() {
  const storedVersion = localStorage.getItem(COLLECTIONS_VERSION_KEY);
  if (storedVersion === COLLECTIONS_VERSION) return;
  localStorage.setItem(COLLECTIONS_VERSION_KEY, COLLECTIONS_VERSION);
  localStorage.removeItem("cart-items");
  localStorage.removeItem("favorites");
  window.dispatchEvent(new CustomEvent("app-storage-updated"));
}

migrateCollectionsIfNeeded();

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
            variant_id: row.variantId,
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
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isValidCartRow) : [];
  } catch {
    return [];
  }
}

export function addToCart(
  productId: number,
  quantity = 1,
  slug?: string,
  variant?: {
    id: number | null;
    label: string;
    variantType: string;
    sizeMl: number | null;
    price: number;
    imageUrl: string;
  }
) {
  const rows = getCartRows();
  const variantKey = variant?.id ?? null;
  const existing = rows.find((r) => (variantKey !== null ? r.variantId === variantKey : r.id === productId && !r.variantId));
  if (existing) {
    existing.quantity += quantity;
    if (slug && !existing.slug) existing.slug = slug;
    if (variant && variantKey !== null) {
      existing.variantId = variantKey;
      existing.variantLabel = variant.label;
      existing.variantType = variant.variantType;
      existing.variantSizeMl = variant.sizeMl;
      existing.variantPrice = variant.price;
      existing.variantImage = variant.imageUrl;
    }
  } else {
    rows.push({
      id: productId,
      quantity,
      slug,
      variantId: variantKey ?? undefined,
      variantLabel: variant?.label,
      variantType: variant?.variantType,
      variantSizeMl: variant?.sizeMl,
      variantPrice: variant?.price,
      variantImage: variant?.imageUrl,
    });
  }
  localStorage.setItem("cart-items", JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent("app-storage-updated"));
  void syncJson("/me/cart/", {
    items: rows.map((row) => ({ product_id: row.id, product_slug: row.slug, variant_id: row.variantId, quantity: row.quantity })),
  }, "POST");
}

export function getFavoriteIds(): number[] {
  try {
    const raw = localStorage.getItem("favorites");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((value): value is number => typeof value === "number") : [];
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
