import { getAuthToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000/api";

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
    throw new Error(`API error: ${res.status}`);
  }
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
  shipping_fee?: string;
  items: Array<{ product_id: number; quantity: number }>;
}) {
  return request<{ code: string; status: string; total: string }>("/orders/", {
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
  price: string;
  old_price: string | null;
  stock: number;
  image_url: string;
  is_active: boolean;
  category: { id: number; name: string; slug: string };
};

export async function getProducts(params?: { category?: string; q?: string }) {
  const search = new URLSearchParams();
  if (params?.category) search.set("category", params.category);
  if (params?.q) search.set("q", params.q);
  const qs = search.toString();
  return request<ApiProduct[]>(`/products/${qs ? `?${qs}` : ""}`);
}

export async function getProductBySlug(slug: string) {
  return request<ApiProduct>(`/products/${slug}/`);
}
