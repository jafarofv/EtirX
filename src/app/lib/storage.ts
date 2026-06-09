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

async function fetchJson<T>(path: string): Promise<T | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function cartLineKey(row: { id: number; variantId?: number }): string {
  return row.variantId != null ? `v:${row.variantId}` : `p:${row.id}`;
}

function isValidCartRow(value: unknown): value is CartRow {
  if (!value || typeof value !== "object") return false;
  const row = value as CartRow;
  return (
    typeof row.id === "number" &&
    Number.isInteger(row.id) &&
    row.id > 0 &&
    typeof row.quantity === "number" &&
    Number.isInteger(row.quantity) &&
    row.quantity > 0 &&
    row.quantity <= 999 &&
    (typeof row.slug === "string" || typeof row.slug === "undefined") &&
    (typeof row.variantId === "number" || typeof row.variantId === "undefined")
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

type ServerCartItem = {
  product?: { id?: number; slug?: string } | null;
  variant?: {
    id?: number;
    label?: string;
    variant_type?: string;
    size_ml?: number | null;
    price?: string | number;
    image_url?: string;
  } | null;
  quantity?: number;
};

type ServerFavorite = { product?: { id?: number } | null };

function serverItemToCartRow(item: ServerCartItem): CartRow | null {
  const productId = item.product?.id;
  const quantity = item.quantity;
  if (typeof productId !== "number" || typeof quantity !== "number" || quantity <= 0) {
    return null;
  }
  const variant = item.variant ?? undefined;
  return {
    id: productId,
    quantity,
    slug: item.product?.slug,
    variantId: typeof variant?.id === "number" ? variant.id : undefined,
    variantLabel: variant?.label,
    variantType: variant?.variant_type,
    variantSizeMl: variant?.size_ml ?? null,
    variantPrice: variant?.price != null ? Number(variant.price) : undefined,
    variantImage: variant?.image_url,
  };
}

/**
 * Pull the server-side cart & favorites and MERGE them into localStorage.
 * Must run on login/registration BEFORE syncStoredCollections(), because that
 * push is destructive (the backend deletes-then-recreates from the payload).
 * Without this merge, signing in on a fresh browser would wipe a cart/favorites
 * the user built on another device. Merge keeps the union; for a cart line that
 * exists both locally and on the server, the larger quantity wins (no silent loss).
 */
export async function hydrateCollectionsFromServer() {
  const token = getAuthToken();
  if (!token) return;
  const [serverCart, serverFavorites] = await Promise.all([
    fetchJson<ServerCartItem[]>("/me/cart/"),
    fetchJson<ServerFavorite[]>("/me/favorites/"),
  ]);

  let changed = false;

  if (Array.isArray(serverCart)) {
    const merged = new Map<string, CartRow>();
    for (const row of getCartRows()) {
      merged.set(cartLineKey(row), { ...row });
    }
    for (const item of serverCart) {
      const row = serverItemToCartRow(item);
      if (!row || !isValidCartRow(row)) continue;
      const key = cartLineKey(row);
      const existing = merged.get(key);
      if (existing) {
        // larger quantity wins; backfill any missing variant/slug metadata
        if (row.quantity > existing.quantity) existing.quantity = row.quantity;
        merged.set(key, { ...row, ...existing, quantity: existing.quantity });
      } else {
        merged.set(key, row);
      }
    }
    localStorage.setItem("cart-items", JSON.stringify([...merged.values()]));
    changed = true;
  }

  if (Array.isArray(serverFavorites)) {
    const ids = new Set<number>(getFavoriteIds());
    for (const fav of serverFavorites) {
      const id = fav.product?.id;
      if (typeof id === "number") ids.add(id);
    }
    localStorage.setItem("favorites", JSON.stringify([...ids]));
    changed = true;
  }

  if (changed) {
    window.dispatchEvent(new CustomEvent("app-storage-updated"));
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
