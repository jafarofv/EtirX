import { getAuthToken } from "./auth";

const API_BASE = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    ...init,
  });
  if (!res.ok) {
    const bodyText = await res.text();
    let message = bodyText || `API error: ${res.status}`;
    try {
      const parsed = JSON.parse(bodyText) as Record<string, unknown>;
      if (typeof parsed.detail === "string") {
        message = parsed.detail;
      } else {
        const firstKey = Object.keys(parsed)[0];
        const firstVal = parsed[firstKey];
        if (Array.isArray(firstVal) && typeof firstVal[0] === "string") {
          message = firstVal[0];
        }
      }
    } catch {
      // keep plain text
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function sendContact(payload: { name: string; email: string; message: string }) {
  return request("/contact/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function trackOrder(code: string) {
  return request<{ code: string; status: string; created_at: string }>(`/orders/${code}/tracking/`);
}

export async function createOrder(payload: {
  full_name: string;
  phone: string;
  address: string;
  notes?: string;
  promo_code?: string;
  shipping_fee?: string;
  items: Array<{ product_id: number; product_slug?: string; quantity: number }>;
}) {
  return request<{
    code: string;
    full_name: string;
    phone: string;
    address: string;
    notes: string;
    promo_code: string;
    discount_amount: string;
    payment_method: string;
    status: string;
    subtotal: string;
    shipping_fee: string;
    total: string;
    created_at: string;
    items: Array<{ product: number; product_name: string; product_image: string; quantity: number; unit_price: string }>;
  }>("/orders/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type ApiProduct = {
  id: number;
  name: string;
  slug: string;
  brand: string;
  description: string;
  top_notes: string;
  heart_notes: string;
  base_notes: string;
  price: string;
  old_price: string | null;
  stock: number;
  image_url: string;
  is_active: boolean;
  category: { id: number; name: string; slug: string };
};

export type ApiCategory = {
  id: number;
  name: string;
  slug: string;
};

export async function getProducts(params?: { category?: string; q?: string }) {
  const search = new URLSearchParams();
  if (params?.category) search.set("category", params.category);
  if (params?.q) search.set("q", params.q);
  const qs = search.toString();
  return request<ApiProduct[]>(`/products/${qs ? `?${qs}` : ""}`);
}

export async function getCategories() {
  return request<ApiCategory[]>("/categories/");
}

export async function getProductBySlug(slug: string) {
  return request<ApiProduct>(`/products/${slug}/`);
}

export async function validatePromoCode(payload: { code: string; subtotal: string }) {
  return request<{
    valid: true;
    promo: {
      id: number;
      code: string;
      title: string;
      description: string;
      discount_type: string;
      discount_value: string;
      min_subtotal: string;
      active: boolean;
      max_total_uses: number | null;
      max_uses_per_user: number;
      starts_at: string | null;
      ends_at: string | null;
      created_at: string;
    };
    discount_amount: string;
    message: string;
  }>("/promo-codes/validate/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
