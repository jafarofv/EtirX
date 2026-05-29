export type CartRow = { id: number; quantity: number };

export function getCartRows(): CartRow[] {
  try {
    const raw = localStorage.getItem("cart-items");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToCart(productId: number, quantity = 1) {
  const rows = getCartRows();
  const existing = rows.find((r) => r.id === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    rows.push({ id: productId, quantity });
  }
  localStorage.setItem("cart-items", JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent("app-storage-updated"));
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

export function toggleFavorite(id: number) {
  const ids = getFavoriteIds();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  localStorage.setItem("favorites", JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("app-storage-updated"));
  return next.includes(id);
}
